import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification

MODEL_PATH = "./trained_models/best_phobert_model"

# Load Tokenizer và Model
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()


def predict_ner(text):
    words = text.split()
    subwords = [tokenizer.bos_token_id]
    for word in words:
        tokens = tokenizer.encode(word, add_special_tokens=False)
        subwords.extend(tokens)
    subwords.append(tokenizer.eos_token_id)
    input_ids = torch.tensor([subwords]).to(device)

    with torch.no_grad():
        outputs = model(input_ids)
        predictions = torch.argmax(outputs.logits, dim=2)[0].cpu().numpy()

    id2label = model.config.id2label
    results = []

    for token_id, pred_id in zip(subwords[1:-1], predictions[1:-1]):
        subword_str = tokenizer.decode([token_id])
        label = id2label[pred_id]
        if label != "O":
            results.append((subword_str, label))
    return results

sample_text = "Bệnh_nhân 1234 nam 35 tuổi sinh_sống tại Hà_Nội vừa được cách_ly"
print(f"Câu đầu vào: {sample_text}\n")
print("NER phát hiện được:")
for word, tag in predict_ner(sample_text):
    print(f"  • {word} ──> {tag}")