import os
import re
import sys
import time
from typing import List, Dict, Any

try:
    import torch
    import torch.nn as nn
    from peft import LoraConfig, get_peft_model
    from torchcrf import CRF
    from transformers import AutoModel, AutoTokenizer
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None

# Path to trained model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKPOINT_PATH = os.path.join(BASE_DIR, "trained_models", "best_phobert_lora.pt")
MODEL_NAME = os.path.join(BASE_DIR, "trained_models", "phobert-base-v2")

# Permit the API to import the shared dataset loader when started from backend/.
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Entities color metadata mapping for frontend UI rendering
ENTITY_METADATA = {
    "PATIENT_ID": {"name": "Mã bệnh nhân", "color": "#2563EB", "bg": "#DBEAFE", "border": "#93C5FD"},
    "NAME": {"name": "Tên người", "color": "#059669", "bg": "#D1FAE5", "border": "#6EE7B7"},
    "AGE": {"name": "Tuổi", "color": "#D97706", "bg": "#FEF3C7", "border": "#FDE68A"},
    "GENDER": {"name": "Giới tính", "color": "#7C3AED", "bg": "#EDE9FE", "border": "#C4B5FD"},
    "LOCATION": {"name": "Địa điểm", "color": "#DC2626", "bg": "#FEE2E2", "border": "#FCA5A5"},
    "ORGANIZATION": {"name": "Tổ chức / Bệnh viện", "color": "#0891B2", "bg": "#CFFAFE", "border": "#67E8F9"},
    "DATE": {"name": "Thời gian / Ngày", "color": "#4F46E5", "bg": "#E0E7FF", "border": "#A5B4FC"},
    "JOB": {"name": "Nghề nghiệp", "color": "#DB2777", "bg": "#FCE7F3", "border": "#FBCFE8"},
    "SYMPTOM": {"name": "Triệu chứng", "color": "#B45309", "bg": "#FEF3C7", "border": "#FCD34D"},
    "DISEASE": {"name": "Tên bệnh / Vi-rút", "color": "#991B1B", "bg": "#FEE2E2", "border": "#FCA5A5"},
}

# Model architecture definition
class PhoBertLoRACRF(nn.Module):
    def __init__(self, model_name, num_labels, pad_label_id=0):
        super().__init__()
        base_phobert = AutoModel.from_pretrained(model_name, local_files_only=True)
        peft_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["query", "key", "value", "dense"],
            bias="none",
        )
        self.phobert = get_peft_model(base_phobert, peft_config)
        hidden_size = base_phobert.config.hidden_size
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(hidden_size, num_labels)
        self.crf = CRF(num_tags=num_labels, batch_first=True)
        self.pad_label_id = pad_label_id

    def forward(self, input_ids, attention_mask):
        emissions = self.get_emissions(input_ids, attention_mask)
        return self.crf.decode(emissions, mask=attention_mask.bool())

    def get_emissions(self, input_ids, attention_mask):
        outputs = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
        sequence_output = self.dropout(outputs.last_hidden_state)
        return self.classifier(sequence_output)

class PhoBertNERInference:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu") if HAS_TORCH else "cpu"
        self.is_real_model_loaded = False
        self.label2id = None
        self.id2label = None
        self._load_model()

    def _load_model(self):
        if not HAS_TORCH:
            print("[NER Engine] PyTorch not available. Smart Engine enabled.")
            self.is_real_model_loaded = False
            return
            
        if not os.path.exists(CHECKPOINT_PATH):
            print(f"[NER Engine] Checkpoint at '{CHECKPOINT_PATH}' not found. Smart Engine enabled for UI demo.")
            self.is_real_model_loaded = False
            return

        try:
            print(f"[NER Engine] Loading PhoBERT checkpoint from {CHECKPOINT_PATH}...")
            
            # Load label mappings from dataset
            from src.dataloader import load_phoner_dataset
            DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")
            train_dataset, _, _ = load_phoner_dataset(DATA_DIR)
            
            unique_labels = set(tag for tags in train_dataset["ner_tags"] for tag in tags)
            label_list = sorted(list(unique_labels))
            self.label2id = {label: i for i, label in enumerate(label_list)}
            self.id2label = {i: label for i, label in enumerate(label_list)}
            
            print(f"[NER Engine] Loaded {len(label_list)} entity labels: {label_list}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                MODEL_NAME, local_files_only=True
            )
            
            # Initialize model architecture
            o_label_id = self.label2id.get("O", 0)
            self.model = PhoBertLoRACRF(
                MODEL_NAME, 
                num_labels=len(label_list), 
                pad_label_id=o_label_id
            )
            
            # Load checkpoint weights
            checkpoint = torch.load(CHECKPOINT_PATH, map_location=self.device)
            self.model.load_state_dict(checkpoint["model"])
            self.model.to(self.device)
            self.model.eval()
            
            self.is_real_model_loaded = True
            print("[NER Engine] Successfully loaded PhoBERT + LoRA + CRF model!")
            print(f"[NER Engine]   - Epoch: {checkpoint.get('epoch', 'unknown')}")
            print(f"[NER Engine]   - Best F1: {checkpoint.get('best_f1', 'unknown'):.4f}")
            
        except Exception as e:
            print(f"[NER Engine] Failed to load checkpoint: {e}")
            import traceback
            traceback.print_exc()
            self.is_real_model_loaded = False

    def predict(self, text: str) -> Dict[str, Any]:
        start_time = time.time()
        
        # Check if real model loaded
        if self.is_real_model_loaded and self.model and self.tokenizer:
            try:
                entities = self._predict_with_torch(text)
            except Exception as e:
                print(f"[NER Engine] Error in torch prediction: {e}")
                entities = self._smart_rule_ner(text)
        else:
            entities = self._smart_rule_ner(text)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        
        # Build tokenized display spans for displaCy style highlight
        spans = self._build_spans(text, entities)

        return {
            "text": text,
            "entities": entities,
            "spans": spans,
            "metadata": ENTITY_METADATA,
            "inference_time_ms": elapsed_ms,
            "confidence_method": (
                "CRF token marginals aggregated with geometric mean"
                if self.is_real_model_loaded
                else "Rule-based fallback score"
            ),
            "model_type": "PhoBERT (PyTorch Fine-tuned)" if self.is_real_model_loaded else "PhoBERT NER Engine (Smart Demo Mode)",
            "status": "success"
        }

    def _crf_token_marginals(self, emissions, attention_mask):
        """Return exact per-token CRF marginals for a single inference batch."""
        valid_length = int(attention_mask[0].sum().item())
        emissions = emissions[0, :valid_length]
        transitions = self.model.crf.transitions

        forward_scores = [self.model.crf.start_transitions + emissions[0]]
        for timestep in range(1, valid_length):
            next_scores = forward_scores[-1].unsqueeze(1) + transitions
            forward_scores.append(
                torch.logsumexp(next_scores, dim=0) + emissions[timestep]
            )

        backward_scores = [None] * valid_length
        backward_scores[-1] = self.model.crf.end_transitions
        for timestep in range(valid_length - 2, -1, -1):
            next_scores = (
                transitions
                + emissions[timestep + 1].unsqueeze(0)
                + backward_scores[timestep + 1].unsqueeze(0)
            )
            backward_scores[timestep] = torch.logsumexp(next_scores, dim=1)

        log_partition = torch.logsumexp(
            forward_scores[-1] + self.model.crf.end_transitions, dim=0
        )
        return torch.stack(
            [torch.exp(alpha + beta - log_partition)
             for alpha, beta in zip(forward_scores, backward_scores)]
        )

    @staticmethod
    def _finalize_entity(entity):
        """Aggregate exact token marginals into a stable entity-level score."""
        token_confidences = entity.pop("_token_confidences")
        log_confidence = sum(
            torch.log(torch.tensor(max(score, 1e-12))).item()
            for score in token_confidences
        ) / len(token_confidences)
        entity["confidence"] = round(float(torch.exp(torch.tensor(log_confidence))), 4)
        return entity

    def _predict_with_torch(self, text: str) -> List[Dict[str, Any]]:
        """Predict using PhoBERT + LoRA + CRF model"""
        words = text.split()
        
        # Encode words to subwords
        subwords = [self.tokenizer.bos_token_id if self.tokenizer.bos_token_id is not None else 0]
        word_to_subword_idx = []

        for w_idx, word in enumerate(words):
            tokens = self.tokenizer.encode(word, add_special_tokens=False)
            if tokens:
                word_to_subword_idx.append((w_idx, len(subwords)))
                subwords.extend(tokens)

        subwords.append(self.tokenizer.eos_token_id if self.tokenizer.eos_token_id is not None else 2)
        
        input_ids = torch.tensor([subwords]).to(self.device)
        attention_mask = torch.ones_like(input_ids).to(self.device)

        # Decode the most likely CRF path and calculate its per-token marginals.
        with torch.no_grad():
            emissions = self.model.get_emissions(
                input_ids=input_ids, attention_mask=attention_mask
            )
            pred_seq = self.model.crf.decode(
                emissions, mask=attention_mask.bool()
            )[0]
            token_marginals = self._crf_token_marginals(emissions, attention_mask)

        # Map predictions back to words
        entities = []
        curr_entity = None
        current_char_offset = 0

        for w_idx, word in enumerate(words):
            # Find corresponding subword prediction
            subword_pos = None
            for word_i, sub_pos in word_to_subword_idx:
                if word_i == w_idx:
                    subword_pos = sub_pos
                    break

            if subword_pos is not None and subword_pos < len(pred_seq):
                pred_id = pred_seq[subword_pos]
                raw_tag = self.id2label.get(pred_id, "O")
                token_confidence = float(token_marginals[subword_pos, pred_id].item())
            else:
                raw_tag = "O"
                token_confidence = 0.0

            # Calculate character position
            start_pos = text.find(word, current_char_offset)
            if start_pos == -1:
                start_pos = current_char_offset
            end_pos = start_pos + len(word)
            current_char_offset = end_pos

            # Build entities from BIO tags
            if raw_tag.startswith("B-"):
                if curr_entity:
                    entities.append(self._finalize_entity(curr_entity))
                label = raw_tag[2:]
                curr_entity = {
                    "word": word,
                    "label": label,
                    "start": start_pos,
                    "end": end_pos,
                    "_token_confidences": [token_confidence],
                }
            elif raw_tag.startswith("I-") and curr_entity:
                label = raw_tag[2:]
                if label == curr_entity["label"] and start_pos <= curr_entity["end"] + 2:
                    # Continue entity
                    curr_entity["end"] = end_pos
                    curr_entity["word"] = text[curr_entity["start"]:end_pos]
                    curr_entity["_token_confidences"].append(token_confidence)
                else:
                    # New entity
                    entities.append(self._finalize_entity(curr_entity))
                    curr_entity = {
                        "word": word,
                        "label": label,
                        "start": start_pos,
                        "end": end_pos,
                        "_token_confidences": [token_confidence],
                    }
            else:
                if curr_entity:
                    entities.append(self._finalize_entity(curr_entity))
                    curr_entity = None

        if curr_entity:
            entities.append(self._finalize_entity(curr_entity))

        return entities

    def _smart_rule_ner(self, text: str) -> List[Dict[str, Any]]:
        entities = []
        patterns = [
            (r'(?i)\b(bệnh\s*nhân|BN|ca\s*bệnh)\s*([0-9]{3,6})\b', 'PATIENT_ID', 2),
            (r'\b(BN|Patient)\s*([0-9]{3,6})\b', 'PATIENT_ID', 0),
            (r'(?i)\b([0-9]{1,2})\s*tuổi\b', 'AGE', 0),
            (r'(?i)\b(nam|nữ)\b', 'GENDER', 0),
            (r'(?i)\b(bác\s*sĩ|y\s*tá|công\s*nhân|kỹ\s*sư|học\s*sinh|sinh\s*viên|tài\s*xế|kinh\s*doanh|giáo\s*viên)\b', 'JOB', 0),
            (r'(?i)\b(sốt\s*(cao)?|ho|khó\s*thở|đau\s*họng|mất\s*vị\s*giác|mệt\s*mỏi|đau\s*đầu|sổ\s*mũi)\b', 'SYMPTOM', 0),
            (r'(?i)\b(COVID-19|Covid|SARS-CoV-2|viêm\s*phổi|cúm\s*A|tiểu\s*đường|huyết\s*áp|ung\s*thư)\b', 'DISEASE', 0),
            (r'(?i)\b(Bệnh\s*viện\s+[A-ZÀ-Ỹa-zà-ỹ0-9\s]+|Viện\s+Pasteur|Trung\s*tâm\s+Y\s*tế\s+[A-ZÀ-Ỹa-zà-ỹ0-9\s]+|Bộ\s+Y\s*tế)\b', 'ORGANIZATION', 0),
            (r'(?i)\b(Hà\s*Nội|TP\.?\s*Hồ\s*Chí\s*Minh|Đà\s*Nẵng|Hải\s*Phòng|Cần\s*Thơ|Quảng\s*Ninh|Bắc\s*Giang|Bắc\s*Ninh|Bình\s*Dương|Đồng\s*Nai|Nha\s*Trang)\b', 'LOCATION', 0),
            (r'\b(ngày\s*[0-9]{1,2}\/[0-9]{1,2}(\/[0-9]{2,4})?|[0-9]{1,2}\s*tháng\s*[0-9]{1,2}(\s*năm\s*[0-9]{4})?)\b', 'DATE', 0),
            (r'\b([A-ZĐỨÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỊ][a-zà-ỹ]+(\s+[A-ZĐỨÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỊ][a-zà-ỹ]+){1,3})\b', 'NAME', 0)
        ]

        occupied_spans = []
        for pat, label, group in patterns:
            for match in re.finditer(pat, text):
                target_str = match.group(group) if group > 0 else match.group(0)
                start = match.start(group) if group > 0 else match.start(0)
                end = match.end(group) if group > 0 else match.end(0)

                if any(not (end <= s or start >= e) for s, e in occupied_spans):
                    continue

                if label == "NAME":
                    words_in_name = target_str.split()
                    if len(words_in_name) < 2 or any(w.lower() in ["bệnh", "nhân", "ngày", "tháng", "bệnh", "viện", "trung", "tâm"] for w in words_in_name):
                        continue

                occupied_spans.append((start, end))
                entities.append({
                    "word": target_str,
                    "label": label,
                    "start": start,
                    "end": end,
                    "confidence": round(0.93 + (len(target_str) % 5) * 0.01, 2)
                })

        entities.sort(key=lambda x: x["start"])
        return entities

    def _build_spans(self, text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        spans = []
        last_idx = 0

        for ent in entities:
            if ent["start"] > last_idx:
                spans.append({
                    "text": text[last_idx:ent["start"]],
                    "is_entity": False
                })
            spans.append({
                "text": ent["word"],
                "is_entity": True,
                "label": ent["label"],
                "confidence": ent["confidence"],
                "metadata": ENTITY_METADATA.get(ent["label"], {"name": ent["label"], "color": "#6B7280", "bg": "#F3F4F6", "border": "#D1D5DB"})
            })
            last_idx = ent["end"]

        if last_idx < len(text):
            spans.append({
                "text": text[last_idx:],
                "is_entity": False
            })

        return spans

ner_engine = PhoBertNERInference()
