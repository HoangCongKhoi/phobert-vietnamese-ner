import os

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import torch
from dataloader import load_phoner_dataset
from seqeval.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from torch.utils.data import DataLoader
from tqdm import tqdm
from torch.optim import AdamW
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

# CONFIG & PATHS
MODEL_NAME = "vinai/phobert-base-v2"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")
OUTPUT_DIR = "./phobert_phoner_results"

# Load Dataset
train_dataset, dev_dataset, test_dataset = load_phoner_dataset(DATA_DIR)

unique_labels = set(tag for tags in train_dataset["ner_tags"] for tag in tags)
label_list = sorted(list(unique_labels))
label2id = {label: i for i, label in enumerate(label_list)}
id2label = {i: label for i, label in enumerate(label_list)}

print(f"✅ Tìm thấy {len(label_list)} nhãn NER trong PhoNER_COVID19.")

# ==========================================
# 2. TOKENIZATION & SUBWORD ALIGNMENT
# ==========================================
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)


def align_labels_with_tokens(examples):
  input_ids_batch = []
  attention_mask_batch = []
  labels_batch = []
  max_length = 128

  for words, tags in zip(examples["tokens"], examples["ner_tags"]):
    subword_ids = [
        tokenizer.bos_token_id if tokenizer.bos_token_id is not None else 0
    ]
    subword_labels = [-100]

    for word, tag in zip(words, tags):
      word_subwords = tokenizer.encode(word, add_special_tokens=False)

      if not word_subwords:
        continue

      subword_ids.extend(word_subwords)
      subword_labels.append(label2id[tag])
      subword_labels.extend([-100] * (len(word_subwords) - 1))

    subword_ids.append(
        tokenizer.eos_token_id if tokenizer.eos_token_id is not None else 2
    )
    subword_labels.append(-100)

    if len(subword_ids) > max_length:
      subword_ids = subword_ids[:max_length]
      subword_labels = subword_labels[:max_length]

    # 4. Padding
    padding_len = max_length - len(subword_ids)
    if padding_len > 0:
      attention_mask = [1] * len(subword_ids) + [0] * padding_len
      subword_ids = subword_ids + [tokenizer.pad_token_id] * padding_len
      subword_labels = subword_labels + [-100] * padding_len
    else:
      attention_mask = [1] * len(subword_ids)

    input_ids_batch.append(subword_ids)
    attention_mask_batch.append(attention_mask)
    labels_batch.append(subword_labels)

  return {
      "input_ids": input_ids_batch,
      "attention_mask": attention_mask_batch,
      "labels": labels_batch,
  }


# Mapping data
train_encoded = train_dataset.map(align_labels_with_tokens, batched=True)
dev_encoded = dev_dataset.map(align_labels_with_tokens, batched=True)
test_encoded = test_dataset.map(align_labels_with_tokens, batched=True)

train_encoded.set_format(
    type="torch", columns=["input_ids", "attention_mask", "labels"]
)
dev_encoded.set_format(
    type="torch", columns=["input_ids", "attention_mask", "labels"]
)
test_encoded.set_format(
    type="torch", columns=["input_ids", "attention_mask", "labels"]
)

BATCH_SIZE = 16
train_loader = DataLoader(train_encoded, batch_size=BATCH_SIZE, shuffle=True)
dev_loader = DataLoader(dev_encoded, batch_size=BATCH_SIZE)
test_loader = DataLoader(test_encoded, batch_size=BATCH_SIZE)

# TRAINING PHASE
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = AutoModelForTokenClassification.from_pretrained(
    MODEL_NAME,
    num_labels=len(label_list),
    id2label=id2label,
    label2id=label2id,
)
model.to(device)

EPOCHS = 5
best_f1 = 0.0
SAVE_PATH = os.path.join(OUTPUT_DIR, "best_phobert_model")
optimizer = AdamW(model.parameters(), lr=3e-5, weight_decay=0.01)
total_steps = len(train_loader) * EPOCHS
scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=int(total_steps * 0.1),
    num_training_steps=total_steps,
)

for epoch in range(EPOCHS):
  # --- TRAIN ---
  model.train()
  total_train_loss = 0

  train_pbar = tqdm(
      train_loader,
      desc=f"Epoch {epoch+1}/{EPOCHS} [Train]",
      bar_format="{l_bar}{bar:20}{r_bar}{bar:-10b}",
  )

  for batch in train_pbar:
    optimizer.zero_grad()

    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)
    labels = batch["labels"].to(device)

    outputs = model(
        input_ids=input_ids, attention_mask=attention_mask, labels=labels
    )
    loss = outputs.loss

    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()
    scheduler.step()

    total_train_loss += loss.item()
    train_pbar.set_postfix({"batch_loss": f"{loss.item():.4f}"})

  avg_train_loss = total_train_loss / len(train_loader)

  # --- VALIDATION ---
  model.eval()
  total_val_loss = 0
  val_preds, val_labels = [], []

  val_pbar = tqdm(dev_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [ Valid ]", leave=False)

  with torch.no_grad():
    for batch in val_pbar:
      input_ids = batch["input_ids"].to(device)
      attention_mask = batch["attention_mask"].to(device)
      labels = batch["labels"].to(device)

      outputs = model(
          input_ids=input_ids, attention_mask=attention_mask, labels=labels
      )
      loss = outputs.loss
      total_val_loss += loss.item()

      logits = outputs.logits.detach().cpu().numpy()
      label_ids = labels.to("cpu").numpy()
      preds = np.argmax(logits, axis=2)

      for pred, label in zip(preds, label_ids):
        val_preds.append(
            [id2label[p] for (p, l) in zip(pred, label) if l != -100]
        )
        val_labels.append(
            [id2label[l] for (p, l) in zip(pred, label) if l != -100]
        )

  avg_val_loss = total_val_loss / len(dev_loader)
  val_f1 = f1_score(val_labels, val_preds)
  val_precision = precision_score(val_labels, val_preds)
  val_recall = recall_score(val_labels, val_preds)

  print(
      f"Epoch {epoch+1}/{EPOCHS} | "
      f"Train Loss: {avg_train_loss:.4f} | "
      f"Val Loss: {avg_val_loss:.4f} | "
      f"Val Precision: {val_precision:.4f} | "
      f"Val Recall: {val_recall:.4f} | "
      f"Val F1: {val_f1:.4f}\n"
  )
  if val_f1 > best_f1:
      best_f1 = val_f1
      print(f"F1 cải thiện lên {best_f1:.4f}! Đang lưu model tốt nhất vào: {SAVE_PATH}...")

      # Lưu cả Weights mô hình lẫn Tokenizer
      model.save_pretrained(SAVE_PATH)
      tokenizer.save_pretrained(SAVE_PATH)

# ==========================================
# 4. EVALUATE ON TEST SET & VISUALIZE
# ==========================================
print("Đang đánh giá trên tập TEST...")
model.eval()
test_preds, test_labels = [], []

with torch.no_grad():
  for batch in tqdm(test_loader, desc="[ Testing ]"):
    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)
    labels = batch["labels"].to(device)

    outputs = model(input_ids=input_ids, attention_mask=attention_mask)
    logits = outputs.logits.detach().cpu().numpy()
    label_ids = labels.to("cpu").numpy()
    preds = np.argmax(logits, axis=2)

    for pred, label in zip(preds, label_ids):
      test_preds.append(
          [id2label[p] for (p, l) in zip(pred, label) if l != -100]
      )
      test_labels.append(
          [id2label[l] for (p, l) in zip(pred, label) if l != -100]
      )

report = classification_report(test_labels, test_preds)
print("\n--- REPORT (TEST SET) ---")
print(report)

# Trực quan hóa kết quả
report_dict = classification_report(test_labels, test_preds, output_dict=True)
entities, f1_scores = [], []
for k, v in report_dict.items():
  if k not in ["macro avg", "weighted avg", "micro avg"]:
    entities.append(k)
    f1_scores.append(v["f1-score"])

df_res = pd.DataFrame({"Entity": entities, "F1-Score": f1_scores}).sort_values(
    by="F1-Score", ascending=False
)

plt.figure(figsize=(12, 6))
sns.barplot(x="F1-Score", y="Entity", data=df_res, palette="crest")
plt.title("PhoBERT Performance on PhoNER_COVID19 Dataset (Test Set)")
plt.xlim(0, 1.0)
plt.tight_layout()
plt.savefig("phoner_covid19_f1_scores.png", dpi=300)
plt.show()
#Save load
