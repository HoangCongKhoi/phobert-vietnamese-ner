import glob
import itertools
import os
import shutil
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from torchcrf import CRF
from tqdm.autonotebook import tqdm
from transformers import (
    AutoModel,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

# Thư viện PEFT hỗ trợ LoRA
from peft import LoraConfig, get_peft_model

from dataloader import load_phoner_dataset
from seqeval.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)

# ==========================================
# 1. CONFIG & PATHS
# ==========================================
MODEL_NAME = "vinai/phobert-base-v2"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")
KAGGLE_INPUT_DIR = "/kaggle/input"

LOGGING_DIR = "./runs/phobert_lora_crf_ner"
CHECKPOINT_DIR = "./trained_models"
BEST_LORA_DIR = os.path.join(CHECKPOINT_DIR, "best_phobert_lora_weights")

if os.path.exists(KAGGLE_INPUT_DIR):
  found_files = glob.glob(
      f"{KAGGLE_INPUT_DIR}/**/train_word.conll", recursive=True
  )
  if found_files:
    DATA_DIR = os.path.dirname(found_files[0])
  else:
    DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")

if os.path.isdir(LOGGING_DIR):
  shutil.rmtree(LOGGING_DIR)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

writer = SummaryWriter(LOGGING_DIR)


def plot_confusion_matrix(writer, cm, class_names, epoch=0):
  """Returns a matplotlib figure containing the plotted confusion matrix.

  Args:
     writer: SummaryWriter instance của TensorBoard
     cm (array, shape = [n, n]): a confusion matrix of integer classes
     class_names (array, shape = [n]): String names of the integer classes
     epoch (int): Epoch hiện tại để log vào TensorBoard
  """
  figure = plt.figure(figsize=(16, 16))
  # color map: https://matplotlib.org/stable/gallery/color/colormap_reference.html
  plt.imshow(cm, interpolation="nearest", cmap="ocean")
  plt.title("Confusion matrix", fontsize=16, fontweight="bold")
  plt.colorbar()
  tick_marks = np.arange(len(class_names))
  plt.xticks(tick_marks, class_names, rotation=45, ha="right")
  plt.yticks(tick_marks, class_names)

  # Normalize the confusion matrix.
  cm_norm = np.around(
      cm.astype("float") / (cm.sum(axis=1)[:, np.newaxis] + 1e-9), decimals=2
  )

  # Use white text if squares are dark; otherwise black.
  threshold = cm_norm.max() / 2.0

  for i, j in itertools.product(range(cm.shape[0]), range(cm.shape[1])):
    color = "white" if cm_norm[i, j] > threshold else "black"
    plt.text(
        j,
        i,
        f"{cm_norm[i, j]:.2f}",
        horizontalalignment="center",
        verticalalignment="center",
        color=color,
        fontsize=9,
    )

  plt.tight_layout()
  plt.ylabel("True label", fontsize=12)
  plt.xlabel("Predicted label", fontsize=12)

  writer.add_figure("Confusion_Matrix", figure, global_step=epoch)

  save_path = "confusion_matrix.png"
  plt.savefig(save_path, dpi=300)
  plt.close(figure)

# ==========================================
# 2. DATA LOADING & ENCODING
# ==========================================
train_dataset, dev_dataset, test_dataset = load_phoner_dataset(DATA_DIR)

unique_labels = set(tag for tags in train_dataset["ner_tags"] for tag in tags)
label_list = sorted(list(unique_labels))
label2id = {label: i for i, label in enumerate(label_list)}
id2label = {i: label for i, label in enumerate(label_list)}

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


# ==========================================
# 3. ARCHITECTURE: PHOBERT + LORA + CRF
# ==========================================
class PhoBertLoRACRF(nn.Module):

  def __init__(self, model_name, num_labels, pad_label_id=0):
    super().__init__()
    base_phobert = AutoModel.from_pretrained(model_name)
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=[
            "query",
            "value",
        ],
        lora_dropout=0.1,
        bias="none",
    )

    # Wrap PhoBERT bằng LoRA
    self.phobert = get_peft_model(base_phobert, peft_config)
    print("\nTHÔNG SỐ BỘ LORA THAM SỐ:")
    self.phobert.print_trainable_parameters()  # In số lượng tham số thực sự cần train

    hidden_size = base_phobert.config.hidden_size
    self.dropout = nn.Dropout(0.1)
    self.classifier = nn.Linear(hidden_size, num_labels)
    self.crf = CRF(num_tags=num_labels, batch_first=True)
    self.pad_label_id = pad_label_id

  def forward(self, input_ids, attention_mask, labels=None):
    outputs = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
    sequence_output = self.dropout(outputs.last_hidden_state)
    emissions = self.classifier(sequence_output)

    mask = attention_mask.bool()

    if labels is not None:
      clean_labels = labels.clone()
      clean_labels[clean_labels == -100] = self.pad_label_id

      log_likelihood = self.crf(
          emissions, clean_labels, mask=mask, reduction="token_mean"
      )
      return -log_likelihood
    else:
      best_paths = self.crf.decode(emissions, mask=mask)
      return best_paths


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
o_label_id = label2id.get("O", 0)
model = PhoBertLoRACRF(
    MODEL_NAME, num_labels=len(label_list), pad_label_id=o_label_id
).to(device)

EPOCHS = 5
# Với LoRA, Learning Rate thường đặt cao hơn 1 chút (1e-3 đến 3e-4) để học nhanh hơn
optimizer = AdamW(model.parameters(), lr=5e-4, weight_decay=0.01)
num_iters = len(train_loader)
total_steps = num_iters * EPOCHS

scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=int(total_steps * 0.1),
    num_training_steps=total_steps,
)

best_f1 = 0.0

# ==========================================
# 4. TRAINING LOOP
# ==========================================
for epoch in range(EPOCHS):
  model.train()
  total_train_loss = 0

  progress_bar = tqdm(
      train_loader,
      desc=f"Epoch {epoch+1}/{EPOCHS}",
      colour="green",
      leave=True,
  )

  for iter_idx, batch in enumerate(progress_bar):
    optimizer.zero_grad()

    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)
    labels = batch["labels"].to(device)

    loss = model(
        input_ids=input_ids, attention_mask=attention_mask, labels=labels
    )
    loss_value = loss.item()

    progress_bar.set_description(
        f"Epoch {epoch+1}/{EPOCHS}. Iteration {iter_idx+1}/{num_iters}. Loss"
        f" {loss_value:.4f}"
    )
    step = epoch * num_iters + iter_idx
    writer.add_scalar("Train/Batch_Loss", loss_value, step)

    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()
    scheduler.step()

    total_train_loss += loss_value

  avg_train_loss = total_train_loss / num_iters
  writer.add_scalar("Train/Epoch_Loss", avg_train_loss, epoch)

  # --- VALIDATION PHASE ---
  model.eval()
  total_val_loss = 0
  val_preds, val_labels = [], []

  with torch.no_grad():
    for batch in dev_loader:
      input_ids = batch["input_ids"].to(device)
      attention_mask = batch["attention_mask"].to(device)
      labels = batch["labels"].to(device)

      loss = model(
          input_ids=input_ids, attention_mask=attention_mask, labels=labels
      )
      total_val_loss += loss.item()

      preds = model(input_ids=input_ids, attention_mask=attention_mask)
      label_ids = labels.cpu().numpy()

      for i, label_seq in enumerate(label_ids):
        valid_labels = []
        valid_preds = []
        for j, l in enumerate(label_seq):
          if l != -100:
            valid_labels.append(id2label[l])
            valid_preds.append(id2label[preds[i][j]])
        val_preds.append(valid_preds)
        val_labels.append(valid_labels)

  avg_val_loss = total_val_loss / len(dev_loader)
  val_f1 = f1_score(val_labels, val_preds)
  val_precision = precision_score(val_labels, val_preds)
  val_recall = recall_score(val_labels, val_preds)

  writer.add_scalar("Val/Loss", avg_val_loss, epoch)
  writer.add_scalar("Val/F1", val_f1, epoch)
  writer.add_scalar("Val/Precision", val_precision, epoch)
  writer.add_scalar("Val/Recall", val_recall, epoch)

  print(
      f"\nEpoch {epoch+1}/{EPOCHS} Summary | "
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
  torch.save(checkpoint, os.path.join(CHECKPOINT_DIR, "last_phobert_lora.pt"))

  if val_f1 > best_f1:
    best_f1 = val_f1
    torch.save(checkpoint, os.path.join(CHECKPOINT_DIR, "best_phobert_lora.pt"))
    # Lưu adapter LoRA siêu nhẹ
    model.phobert.save_pretrained(BEST_LORA_DIR)
    tokenizer.save_pretrained(BEST_LORA_DIR)
  print("-" * 60)

# ==========================================
# 5. TEST EVALUATION & VISUALIZATION
# ==========================================
print("\nEVALUATION RESULTS (PHOBERT + LORA + CRF)...")
model.eval()
test_preds, test_labels = [], []

with torch.no_grad():
  for batch in tqdm(test_loader, desc="Testing", colour="blue"):
    input_ids = batch["input_ids"].to(device)
    attention_mask = batch["attention_mask"].to(device)
    labels = batch["labels"].to(device)

    preds = model(input_ids=input_ids, attention_mask=attention_mask)
    label_ids = labels.cpu().numpy()

    for i, label_seq in enumerate(label_ids):
      valid_labels = []
      valid_preds = []
      for j, l in enumerate(label_seq):
        if l != -100:
          valid_labels.append(id2label[l])
          valid_preds.append(id2label[preds[i][j]])
      test_preds.append(valid_preds)
      test_labels.append(valid_labels)

report = classification_report(test_labels, test_preds)
print("\n--- REPORT (TEST SET - PHOBERT + LORA + CRF) ---")
print(report)

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
plt.title("PhoBERT + LoRA + CRF Performance on PhoNER_COVID19 Dataset")
plt.xlim(0, 1.0)
plt.tight_layout()
plt.savefig("phoner_covid19_lora_f1_scores.png", dpi=300)

writer.add_figure("Test/F1_Scores_Per_Entity", fig)
writer.close()