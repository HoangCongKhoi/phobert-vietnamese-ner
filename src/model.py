import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification

# Khởi tạo Tokenizer và Model Baseline
MODEL_NAME = "vinai/phobert-base-v2"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForTokenClassification.from_pretrained(
    MODEL_NAME,
    num_labels=len(num_labels) # Số lượng nhãn NER của bạn (B-PER, I-PER, O,...)
)