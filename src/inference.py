import glob
import os
import re
import torch
import torch.nn as nn
from peft import LoraConfig, get_peft_model
from pyvi import ViTokenizer
from torchcrf import CRF
from transformers import AutoModel, AutoTokenizer

from dataloader import load_phoner_dataset

# ==========================================
# 1. CONFIG & PATHS
# ==========================================
MODEL_NAME = "vinai/phobert-base-v2"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")
CHECKPOINT_DIR = "./trained_models"
MODEL_PATH = os.path.join(CHECKPOINT_DIR, "best_phobert_lora.pt")

KAGGLE_INPUT_DIR = "/kaggle/input"
if os.path.exists(KAGGLE_INPUT_DIR):
  found_files = glob.glob(
      f"{KAGGLE_INPUT_DIR}/**/train_word.conll", recursive=True
  )
  if found_files:
    DATA_DIR = os.path.dirname(found_files[0])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ==========================================
# 2. MODEL DEFINITION
# ==========================================
class PhoBertLoRACRF(nn.Module):

  def __init__(self, model_name, num_labels, pad_label_id=0):
    super().__init__()
    base_phobert = AutoModel.from_pretrained(model_name)
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["query", "value"],
        lora_dropout=0.1,
        bias="none",
    )
    self.phobert = get_peft_model(base_phobert, peft_config)
    hidden_size = base_phobert.config.hidden_size
    self.dropout = nn.Dropout(0.1)
    self.classifier = nn.Linear(hidden_size, num_labels)
    self.crf = CRF(num_tags=num_labels, batch_first=True)
    self.pad_label_id = pad_label_id

  def forward(self, input_ids, attention_mask):
    outputs = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
    sequence_output = self.dropout(outputs.last_hidden_state)
    emissions = self.classifier(sequence_output)
    mask = attention_mask.bool()
    return self.crf.decode(emissions, mask=mask)


# ==========================================
# 3. PIPELINE DỰ ĐOÁN
# ==========================================
class NERPredictor:

  def __init__(self):
    train_dataset, _, _ = load_phoner_dataset(DATA_DIR)
    unique_labels = set(
        tag for tags in train_dataset["ner_tags"] for tag in tags
    )
    self.label_list = sorted(list(unique_labels))
    self.label2id = {label: i for i, label in enumerate(self.label_list)}
    self.id2label = {i: label for i, label in enumerate(self.label_list)}

    self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    self.model = PhoBertLoRACRF(
        MODEL_NAME,
        num_labels=len(self.label_list),
        pad_label_id=self.label2id.get("O", 0),
    ).to(device)

    if os.path.exists(MODEL_PATH):
      checkpoint = torch.load(MODEL_PATH, map_location=device)
      self.model.load_state_dict(checkpoint["model"])
    else:
      print(f"Checkpoint not found: {MODEL_PATH}")

    self.model.eval()

  def predict(self, raw_text: str):
    # Tách từ tiếng Việt bằng PyVi
    segmented_text = ViTokenizer.tokenize(raw_text)
    words = segmented_text.split()

    # Xử lý Subword Tokenization & Alignment
    subword_ids = [
        self.tokenizer.bos_token_id
        if self.tokenizer.bos_token_id is not None
        else 0
    ]
    word_to_subword_mapping = []

    for word in words:
      encoded_subwords = self.tokenizer.encode(word, add_special_tokens=False)
      if not encoded_subwords:
        continue
      word_to_subword_mapping.append(len(subword_ids))
      subword_ids.extend(encoded_subwords)

    subword_ids.append(
        self.tokenizer.eos_token_id
        if self.tokenizer.eos_token_id is not None
        else 2
    )

    input_ids = torch.tensor([subword_ids], dtype=torch.long).to(device)
    attention_mask = torch.ones_like(input_ids).to(device)

    #Model Predict
    with torch.no_grad():
      pred_seq = self.model(input_ids=input_ids, attention_mask=attention_mask)[
          0
      ]

    #Trích xuất nhãn tại các vị trí đầu từ (First Subword Tokens)
    word_labels = []
    for idx in word_to_subword_mapping:
      if idx < len(pred_seq):
        word_labels.append(self.id2label[pred_seq[idx]])
      else:
        word_labels.append("O")

    #Gom nhóm các nhãn BIO thành danh sách Entities
    entities = []
    current_entity = None

    for word, label in zip(words, word_labels):
      word_clean = word.replace("_", " ")

      if label.startswith("B-"):
        if current_entity:
          entities.append(current_entity)
        current_entity = {"text": word_clean, "type": label[2:]}
      elif label.startswith("I-") and current_entity:
        if label[2:] == current_entity["type"]:
          current_entity["text"] += " " + word_clean
        else:
          entities.append(current_entity)
          current_entity = {"text": word_clean, "type": label[2:]}
      else:
        if current_entity:
          entities.append(current_entity)
          current_entity = None

    if current_entity:
      entities.append(current_entity)

    return {
        "raw_text": raw_text,
        "segmented_text": segmented_text,
        "tokens": words,
        "labels": word_labels,
        "entities": entities,
    }


# ==========================================
# 4. TEST INFERENCE
# ==========================================
if __name__ == "__main__":
  predictor = NERPredictor()

  sample_text = (
      "Bệnh nhân 1234 nam 35 tuổi ngụ tại quận Hoàn Kiếm, Hà Nội "
      "được xét nghiệm dương tính với SARS-CoV-2 tại Bệnh viện Bệnh Nhiệt đới"
      " Trung ương."
  )

  result = predictor.predict(sample_text)

  print("\n--- KẾT QUẢ DỰ ĐOÁN NER ---")
  print(f"Văn bản gốc: {result['raw_text']}")
  print(f"Sau tách từ: {result['segmented_text']}\n")

  print("Danh sách thực thể nhận diện được:")
  if result["entities"]:
    for ent in result["entities"]:
      print(f"  • [{ent['type']}]: {ent['text']}")
  else:
    print("Không tìm thấy")