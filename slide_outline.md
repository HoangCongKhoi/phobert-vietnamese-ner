# 📊 Slide Thuyết Trình — PhoBERT & XLM-RoBERTa cho NER Tiếng Việt trong Ngữ Cảnh COVID-19

> **Nhóm thực hiện — UET – VNU**
> - Hoàng Công Khôi — 24022371
> - Trương Huy Hoàng — 24022341
> - Phạm Danh Thái — 24022449

---

## Slide 1: Trang Bìa
- **Tiêu đề**: PhoBERT & XLM-RoBERTa cho Named Entity Recognition Tiếng Việt trong Ngữ Cảnh COVID-19
- **Phụ đề**: Đồ án môn học — Xử lý Ngôn ngữ Tự nhiên (NLP)
- **Thông tin nhóm**: Hoàng Công Khôi (24022371), Trương Huy Hoàng (24022341), Phạm Danh Thái (24022449)
- **Trường**: UET — VNU (Đại học Công nghệ, ĐHQGHN)

---

## Slide 2: Mục Lục
1. Giới thiệu bài toán & Động lực
2. Cơ sở lý thuyết (NER, BIO, Transformer, LoRA, CRF)
3. Bộ dữ liệu PhoNER_COVID19
4. Phân tích dữ liệu (EDA)
5. Kiến trúc mô hình
6. Pipeline huấn luyện
7. Kết quả thực nghiệm
8. Demo ứng dụng web
9. Kết luận & Hướng phát triển

---

## Slide 3: Bài Toán Named Entity Recognition (NER)
- **NER là gì?** Bài toán gán nhãn chuỗi (Sequence Labeling), xác định và phân loại các thực thể có tên trong văn bản
- **Ví dụ minh họa**:
  - Input: `"Bệnh nhân 1234, 32 tuổi, điều trị tại Bệnh viện Chợ Rẫy ngày 15/08"`
  - Output: `Bệnh nhân 1234` → PATIENT_ID, `32 tuổi` → AGE, `Bệnh viện Chợ Rẫy` → ORGANIZATION, `15/08` → DATE
- **Ứng dụng**: Trích xuất thông tin y tế, xây dựng knowledge graph, hỗ trợ giám sát dịch tễ

---

## Slide 4: Động Lực & Mục Tiêu Nghiên Cứu
- **Bối cảnh**: Đại dịch COVID-19 tạo ra lượng lớn văn bản y tế tiếng Việt → cần trích xuất thông tin tự động
- **Thách thức riêng của tiếng Việt**: Từ ghép, dấu thanh, đặc thù hình thái
- **Mục tiêu**:
  1. Fine-tune PhoBERT (mô hình chuyên tiếng Việt) với LoRA + CRF cho NER
  2. So sánh với XLM-RoBERTa (mô hình đa ngôn ngữ)
  3. Xây dựng ứng dụng web demo end-to-end

---

## Slide 5: Cơ Sở Lý Thuyết — Transformer & Pre-trained Language Model
- **Transformer** (Vaswani et al., 2017): Cơ chế Self-Attention, mô hình encoder–decoder
- **BERT** (Devlin et al., 2019): Pre-train encoder bằng MLM & NSP
- **PhoBERT** (VinAI, 2020): Pre-train trên 20GB corpus tiếng Việt, word-level tokenizer (BPE), hiểu ngữ nghĩa tiếng Việt tốt hơn multilingual model
- **XLM-RoBERTa** (Conneau et al., 2020): Pre-train trên 2.5TB dữ liệu 100 ngôn ngữ, SentencePiece tokenizer

---

## Slide 6: Cơ Sở Lý Thuyết — LoRA & CRF
- **LoRA** (Hu et al., 2022): Low-Rank Adaptation — chèn ma trận rank thấp vào các lớp attention thay vì fine-tune toàn bộ tham số
  - Giảm ~96% tham số cần train (chỉ train adapter)
  - Cấu hình: `r=16`, `lora_alpha=32`, target: `query`, `key`, `value`, `dense`
- **CRF** (Conditional Random Field): Lớp giải mã chuỗi, đảm bảo tính nhất quán BIO
  - Ràng buộc: `I-LOC` không thể xuất hiện sau `B-PER`
  - Tối ưu log-likelihood toàn chuỗi thay vì từng token độc lập
- **Kết hợp**: Transformer (biểu diễn ngữ cảnh) + LoRA (hiệu quả tham số) + CRF (giải mã có ràng buộc)

---

## Slide 7: Bộ Dữ Liệu PhoNER_COVID19
- **Nguồn**: Truong et al. (NAACL 2021) — VinAI Research
- **Quy mô**: ~35.000 thực thể trên ~10.000 câu
- **Định dạng**: CoNLL (mỗi dòng: token + nhãn BIO, câu cách nhau bởi dòng trống)
- **10 loại thực thể**:

| Thực thể | Ý nghĩa | Ví dụ |
|----------|---------|-------|
| PATIENT_ID | Mã bệnh nhân | BN 1234 |
| NAME | Tên người | Nguyễn Văn A |
| AGE | Tuổi | 35 tuổi |
| GENDER | Giới tính | nam, nữ |
| LOCATION | Địa điểm | Hà Nội |
| ORGANIZATION | Tổ chức | Bệnh viện Bạch Mai |
| DATE | Thời gian | ngày 15/08 |
| JOB | Nghề nghiệp | tài xế |
| SYMPTOM_AND_DISEASE | Triệu chứng & Bệnh | sốt cao, COVID-19 |
| TRANSPORTATION | Phương tiện | chuyến bay VN123 |

- **Chia tập**: train / dev / test (word-level)

---

## Slide 8: Phân Tích Dữ Liệu (EDA) — Phân Bố Nhãn
- **Biểu đồ**: Tần suất xuất hiện của các nhãn NER (tập Train)
- **Nhận xét**:
  - LOCATION chiếm ưu thế (~6000+ mẫu B-LOCATION, ~6000 I-LOCATION)
  - JOB, NAME, TRANSPORTATION có ít mẫu nhất (long-tail distribution)
  - Mất cân bằng nhãn → cần Data Augmentation và đánh giá bằng F1 thay vì Accuracy

> 📊 *Hình minh họa: tag_distribution.png*

---

## Slide 9: Phân Tích Dữ Liệu (EDA) — Phân Bố Độ Dài Câu
- **Biểu đồ**: Phân bố số lượng tokens trong câu (tập Train)
- **Nhận xét**:
  - Đa số câu có 15–35 tokens
  - Phân phối lệch phải (right-skewed), đuôi dài tới ~160 tokens
  - Lựa chọn `MAX_LENGTH = 128` phù hợp (bao phủ > 95% câu)

> 📊 *Hình minh họa: seq_len_dist.png*

---

## Slide 10: Tăng Cường Dữ Liệu (Data Augmentation)
- **Vấn đề**: Nhãn JOB có rất ít mẫu (~100 B-JOB, ~50 I-JOB)
- **Giải pháp**: Entity Swap Augmentation
  - Tìm các câu chứa thực thể JOB
  - Thay thế bằng nghề nghiệp ngẫu nhiên từ từ điển (16 nghề: bác_sĩ, tài_xế, giáo_viên, ...)
  - Giữ nguyên nhãn BIO và cấu trúc câu
  - Tạo `num_augments_per_sentence = 3` bản sao mỗi câu gốc
- **Kết quả**: Tăng số mẫu JOB đáng kể, cải thiện F1 cho nhãn hiếm

---

## Slide 11: Kiến Trúc Mô Hình — PhoBERT + LoRA + CRF

```
Input Text → Tokenizer (BPE/SentencePiece)
   ↓
PhoBERT / XLM-RoBERTa Encoder (frozen weights)
   ↓
LoRA Adapters (trainable, r=16)
   ↓
Dropout (p=0.1)
   ↓
Linear Classifier (hidden_size → num_labels)
   ↓
CRF Layer (decode best BIO path)
   ↓
Named Entities Output
```

- **PhoBERT**: target_modules = `[query, key, value, dense]`
- **XLM-R**: target_modules = `[query, value]`
- **Số nhãn**: 21 (10 entity × 2 BIO prefix + 1 tag O)

---

## Slide 12: Pipeline Huấn Luyện — Chi Tiết Kỹ Thuật

| Hyperparameter | PhoBERT | XLM-RoBERTa |
|----------------|---------|-------------|
| Backbone | vinai/phobert-base-v2 | xlm-roberta-base |
| LoRA rank (r) | 16 | 16 |
| LoRA alpha | 32 | 32 |
| Epochs | 10 | 10 |
| Batch Size | 16 | 16 |
| Max Length | 128 | 128 |
| LR (LoRA) | 3e-4 | 1e-4 |
| LR (Classifier) | 1e-3 | 5e-4 |
| LR (CRF) | 2e-3 | 1e-3 |
| Warmup | 10% | 10% |
| Optimizer | AdamW | AdamW |
| Scheduler | Linear warmup + decay | Linear warmup + decay |
| Grad Clipping | max_norm = 1.0 | max_norm = 1.0 |

- **Tokenization**: Subword alignment — chỉ gán nhãn cho subword đầu tiên, còn lại đánh `-100`
- **Loss**: Negative log-likelihood CRF (token_mean reduction)
- **Best checkpoint**: Chọn theo Val F1 cao nhất

---

## Slide 13: Learning Curves — Loss & Validation F1

- **Biểu đồ trái**: Train Loss & Val Loss theo Epoch → cả hai mô hình hội tụ nhanh từ epoch 2
- **Biểu đồ phải**: Validation F1 Score theo Epoch
  - PhoBERT: ~0.92 (epoch 1) → ~0.96 (epoch 7–10)
  - XLM-RoBERTa: ~0.80 (epoch 1) → ~0.92 (epoch 10)
- **Nhận xét**: PhoBERT hội tụ nhanh hơn và đạt F1 cao hơn rõ rệt

> 📊 *Hình minh họa: learning_curves.png*

---

## Slide 14: Kết Quả — So Sánh F1-Score Tổng Hợp

| Metric | PhoBERT + LoRA + CRF | XLM-RoBERTa + LoRA + CRF |
|--------|---------------------|--------------------------|
| **Micro avg F1** | **~0.95** | ~0.91 |
| **Macro avg F1** | **~0.95** | ~0.91 |
| **Weighted avg F1** | **~0.95** | ~0.91 |

- PhoBERT vượt trội XLM-R khoảng **+4% F1** trên cả 3 metric
- Lý do: Pre-train chuyên biệt trên corpus tiếng Việt, tokenizer BPE tối ưu cho tiếng Việt

> 📊 *Hình minh họa: overall_metrics_comparison.png*

---

## Slide 15: Kết Quả — F1-Score Theo Từng Thực Thể

| Entity | PhoBERT F1 | XLM-R F1 |
|--------|-----------|----------|
| DATE | ~0.99 | ~0.98 |
| PATIENT_ID | ~0.98 | ~0.98 |
| TRANSPORTATION | ~0.98 | ~0.95 |
| GENDER | ~0.97 | ~0.94 |
| AGE | ~0.97 | ~0.93 |
| LOCATION | ~0.94 | ~0.93 |
| NAME | ~0.95 | ~0.92 |
| ORGANIZATION | ~0.90 | ~0.84 |
| SYMPTOM_AND_DISEASE | ~0.88 | ~0.84 |
| **JOB** | **~0.79** | **~0.49** |

- **Nhận xét**: JOB là nhãn khó nhất do ít mẫu. PhoBERT xử lý tốt hơn đáng kể (+30% F1 so với XLM-R)
- DATE, PATIENT_ID gần như hoàn hảo nhờ pattern rõ ràng

> 📊 *Hình minh họa: model_comparison_f1.png*

---

## Slide 16: Phân Tích Confusion Matrix

- **PhoBERT**: Đường chéo đậm (~0.92–0.99), lỗi chính ở I-JOB (0.70), I-NAME (0.77)
- **XLM-RoBERTa**: I-JOB chỉ đạt 0.31 (phần lớn dự đoán thành O), I-NAME = 0.27, I-AGE = 0 (miss hoàn toàn)
- **Lỗi phổ biến**:
  - JOB, NAME: Các thực thể hiếm dễ bị dự đoán thành O (false negative)
  - ORGANIZATION ↔ LOCATION: Nhầm lẫn do ngữ nghĩa gần nhau
- **Kết luận**: CRF giúp giảm lỗi BIO inconsistency, nhưng data imbalance vẫn là thách thức lớn

> 📊 *Hình minh họa: confusion_matrix_phobert.png & confusion_matrix_xlm-roberta.png*

---

## Slide 17: Ứng Cụ Dụng Demo — Kiến Trúc Hệ Thống

```
┌──────────────┐     POST /api/predict     ┌──────────────────┐     predict()     ┌─────────────────────┐
│   Frontend   │ ──────────────────────►  │   Backend API    │ ───────────────► │  PhoBERT Inference   │
│  React+Vite  │                           │  FastAPI+Pydantic │                  │  Engine (LoRA+CRF)   │
│              │ ◄──────────────────────  │                  │ ◄─────────────── │                     │
│  • Highlight │    JSON Response          │  • CORS          │    Entities       │  • Tokenization      │
│  • Graph     │                           │  • Validation    │                   │  • CRF Decode        │
│  • Dossier   │                           │  • Model Switch  │                   │  • Confidence Score   │
└──────────────┘                           └──────────────────┘                   └─────────────────────┘
```

- **Frontend**: React 19 + Vite + Tailwind CSS, 9 components (Navbar, Sidebar, NerHighlighter, EntityGraph, PatientDossier, ...)
- **Backend**: FastAPI, 2 endpoints (`/api/predict`, `/api/health`)
- **Model Manager**: Quản lý bộ nhớ, chỉ load 1 model tại 1 thời điểm, hỗ trợ chuyển đổi PhoBERT ↔ XLM-R
- **Fallback**: Smart Demo Mode (rule-based NER) khi chưa tải checkpoint

> 📊 *Hình minh họa: architecture.png*

---

## Slide 18: Demo Ứng Dụng Web

- **Tính năng chính**:
  1. **displaCy Visualizer**: Tô sáng thực thể trực tiếp trên văn bản, hiển thị confidence score
  2. **Knowledge Graph**: Biểu đồ quan hệ giữa các thực thể được phát hiện
  3. **Hồ Sơ Bệnh Án (Patient Dossier)**: Tổng hợp thông tin bệnh nhân dạng thẻ, hỗ trợ xuất PDF
  4. **JSON View**: Xem raw output của API, thống kê chi tiết
  5. **Lịch sử phân tích**: Lưu và truy xuất các lần phân tích trước
  6. **Dark/Light Mode**: Hỗ trợ giao diện tối/sáng
  7. **Chọn mô hình**: Chuyển đổi PhoBERT ↔ XLM-RoBERTa realtime

> 📊 *Hình minh họa: demo-screenshot.png*

---

## Slide 19: Kết Luận

- **Đóng góp chính**:
  1. Fine-tune thành công PhoBERT-base-v2 + LoRA + CRF đạt **~95% F1** trên PhoNER_COVID19
  2. So sánh định lượng với XLM-RoBERTa → PhoBERT vượt trội **+4% F1** nhờ pre-training chuyên tiếng Việt
  3. Giải pháp Data Augmentation (Entity Swap) cải thiện nhãn hiếm (JOB)
  4. Xây dựng ứng dụng web demo hoàn chỉnh (FastAPI + React) hỗ trợ inference realtime
  5. Tính toán CRF Token Marginals cho confidence score cấp thực thể

- **Hạn chế**:
  - JOB vẫn là thách thức (F1 ~0.79 PhoBERT, ~0.49 XLM-R)
  - Chưa thử nghiệm trên domain khác ngoài COVID-19
  - Chưa deploy lên cloud

---

## Slide 20: Hướng Phát Triển

1. **Mở rộng domain**: Áp dụng cho các bệnh truyền nhiễm khác, y tế tổng quát
2. **Nâng cấp augmentation**: Label-aware data augmentation, back-translation
3. **Ensemble**: Kết hợp PhoBERT + XLM-R cho kết quả tốt hơn
4. **Active Learning**: Thu thập thêm mẫu cho các nhãn hiếm (JOB, NAME)
5. **Deploy**: Dockerize, triển khai trên cloud (AWS/GCP), thêm authentication
6. **Relation Extraction**: Trích xuất quan hệ giữa các thực thể (ai → ở đâu → triệu chứng gì)

---

## Slide Phụ: Tài Liệu Tham Khảo

1. Truong, T. H., Dao, M. H., & Nguyen, D. Q. (2021). COVID-19 Named Entity Recognition for Vietnamese. *NAACL 2021*.
2. Nguyen, D. Q., & Nguyen, A. T. (2020). PhoBERT: Pre-trained language models for Vietnamese. *Findings of EMNLP 2020*.
3. Conneau, A., et al. (2020). Unsupervised Cross-lingual Representation Learning at Scale. *ACL 2020*.
4. Hu, E. J., et al. (2022). LoRA: Low-Rank Adaptation of Large Language Models. *ICLR 2022*.
5. Lafferty, J., McCallum, A., & Pereira, F. (2001). Conditional Random Fields. *ICML 2001*.
6. Devlin, J., et al. (2019). BERT: Pre-training of Deep Bidirectional Transformers. *NAACL 2019*.
