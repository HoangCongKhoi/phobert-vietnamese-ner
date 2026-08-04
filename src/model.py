import os
import shutil
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import torch
from torch.optim import AdamW
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from tqdm.autonotebook import tqdm
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

from dataloader import load_phoner_dataset
from seqeval.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)

#CONFIG & PATHS
MODEL_NAME = "vinai/phobert-base-v2"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")

LOGGING_DIR = "./runs/phobert_ner"
CHECKPOINT_DIR = "./trained_models"
BEST_HF_MODEL_DIR = os.path.join(CHECKPOINT_DIR, "best_phobert_model")

if os.path.isdir(LOGGING_DIR):
  shutil.rmtree(LOGGING_DIR)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

writer = SummaryWriter(LOGGING_DIR)

train_dataset, dev_dataset, test_dataset = load_phoner_dataset(DATA_DIR)

unique_labels = set(tag for tags in train_dataset["ner_tags"] for tag in tags)
label_list = sorted(list(unique_labels))
label2id = {label: i for i, label in enumerate(label_list)}
id2label = {i: label for i, label in enumerate(label_list)}

#TOKENIZATION & SUBWORD ALIGNMENT
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


# Preprocessing dataset
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

#SETUP MODEL & OPTIMIZER
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = AutoModelForTokenClassification.from_pretrained(
    MODEL_NAME,
    num_labels=len(label_list),
    id2label=id2label,
    label2id=label2id,
)
model.to(device)

EPOCHS = 5
optimizer = AdamW(model.parameters(), lr=3e-5, weight_decay=0.01)
num_iters = len(train_loader)
total_steps = num_iters * EPOCHS

scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=int(total_steps * 0.1),
    num_training_steps=total_steps,
)

best_f1 = 0.0

#TRAINING LOOP (TQDM & TENSORBOARD)
for epoch in range(EPOCHS):
  # --- TRAIN PHASE ---
  model.train()
  total_train_loss = 0

  progress_bar = tqdm(
      train_loader,
      desc=f"Epoch {epoch+1}/{EPOCHS}",
      colour="green",
      leave=True,
  )

  for iter, batch in enumerate(progress_bar):
    optimizer.zero_grad()

    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)
    labels = batch["labels"].to(device)

    outputs = model(
        input_ids=input_ids, attention_mask=attention_mask, labels=labels
    )
    loss = outputs.loss
    loss_value = loss.item()

    progress_bar.set_description(
        f"Epoch {epoch+1}/{EPOCHS}. Iteration {iter+1}/{num_iters}. Loss {loss_value:.4f}"
    )
    step = epoch * num_iters + iter
    writer.add_scalar("Train/Batch_Loss", loss_value, step)

    # Backward
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()
    scheduler.step()

    total_train_loss += loss_value

  avg_train_loss = total_train_loss / num_iters
  writer.add_scalar("Train/Epoch_Loss", avg_train_loss, epoch)

  # --- VALIDATION PHASE
  model.eval()
  total_val_loss = 0
  val_preds, val_labels = [], []

  with torch.no_grad():
    for batch in dev_loader:
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

  writer.add_scalar("Val/Loss", avg_val_loss, epoch)
  writer.add_scalar("Val/F1", val_f1, epoch)
  writer.add_scalar("Val/Precision", val_precision, epoch)
  writer.add_scalar("Val/Recall", val_recall, epoch)

  print(
      f"\n📊 Epoch {epoch+1}/{EPOCHS} Summary | "
      f"Train Loss: {avg_train_loss:.4f} | "
      f"Val Loss: {avg_val_loss:.4f} | "
      f"Val F1: {val_f1:.4f} | "
      f"Val Precision: {val_precision:.4f} | "
      f"Val Recall: {val_recall:.4f}"
  )

  # --- SAVE CHECKPOINT ---
  checkpoint = {
      "epoch": epoch + 1,
      "best_f1": best_f1,
      "model": model.state_dict(),
      "optimizer": optimizer.state_dict(),
  }
  torch.save(checkpoint, os.path.join(CHECKPOINT_DIR, "last_phobert.pt"))

  if val_f1 > best_f1:
    best_f1 = val_f1
    torch.save(checkpoint, os.path.join(CHECKPOINT_DIR, "best_phobert.pt"))
    model.save_pretrained(BEST_HF_MODEL_DIR)
    tokenizer.save_pretrained(BEST_HF_MODEL_DIR)
  print("-" * 60)

#TEST EVALUATION & VISUALIZATION
print("\nEVALUATION RESULTS...")
model.eval()
test_preds, test_labels = [], []

with torch.no_grad():
  for batch in tqdm(test_loader, desc="Testing", colour="blue"):
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

# In báo cáo Test Set
report = classification_report(test_labels, test_preds)
print("\n--- REPORT (TEST SET) ---")
print(report)

# Vẽ biểu đồ F1-Score
lines = report.strip().split("\n")
entities, f1_scores = [], []

for line in lines[2:]:
  parts = line.strip().split()
  if len(parts) >= 4 and parts[0] not in ["micro", "macro", "weighted", "avg"]:
    try:
      entity_name = parts[0]
      f1_val = float(parts[3])
      entities.append(entity_name)
      f1_scores.append(f1_val)
    except ValueError:
      continue

df_res = pd.DataFrame({"Entity": entities, "F1-Score": f1_scores}).sort_values(
    by="F1-Score", ascending=False
)

fig = plt.figure(figsize=(12, 6))
sns.barplot(x="F1-Score", y="Entity", data=df_res, palette="crest")
plt.title("PhoBERT Performance on PhoNER_COVID19 Dataset (Test Set)")
plt.xlim(0, 1.0)
plt.tight_layout()
plt.savefig("phoner_covid19_f1_scores.png", dpi=300)

writer.add_figure("Test/F1_Scores_Per_Entity", fig)
writer.close()
