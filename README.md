# 🇻🇳 PhoBERT + XLM-RoBERTa NER for Vietnamese Clinical Text

Dự án huấn luyện và triển khai mô hình Nhận dạng Thực thể Tên (NER) trên văn bản y tế tiếng Việt với 2 kiến trúc:
- **PhoBERT** + LoRA + CRF (Vietnamese-optimized)
- **XLM-RoBERTa** (Multilingual NER)

Đi kèm với giao diện web tương tác (React + FastAPI) để demo và sử dụng thực tế.

---

## 🚀 Quick Links

- [📥 Download Pre-trained Models](#3--tải-pre-trained-models-khuyên-dùng---bỏ-qua-training) - **Start here** nếu bạn chỉ muốn test
- [🌐 Run Web Application](#-quick-start---chạy-web-application) - Hướng dẫn chạy Frontend + Backend
- [🔧 Training Guide](#-training--evaluation) - Hướng dẫn training từ đầu
- [📊 Results & Performance](#-results-and-visualize) - Xem kết quả models

---

## 📌 Tính năng nổi bật (Features)

### 🔬 Models
- **PhoBERT-base-v2 + LoRA + CRF:** Tối ưu cho tiếng Việt, tiết kiệm bộ nhớ GPU, độ chính xác cao với CRF layer
- **XLM-RoBERTa:** Multilingual model, hỗ trợ cross-lingual NER

### 🌐 Web Application
- **Frontend:** React + Vite với UI hiện đại (displaCy visualizer, Knowledge Graph, Entity Statistics)
- **Backend:** FastAPI với endpoints RESTful
- **Features:** 
  - Real-time NER prediction với cả 2 models
  - Interactive entity highlighting
  - Knowledge graph visualization
  - Patient dossier extraction
  - History tracking

### 🛠️ Training & Evaluation
- **Tiền xử lý:** Hỗ trợ `pyvi` / `vncorenlp` cho văn bản tiếng Việt
- **Visualization:** TensorBoard logging, Training curves, Confusion Matrix
- **Dataset:** PhoNER COVID-19 (10 entity types: PATIENT_ID, NAME, AGE, GENDER, JOB, LOCATION, ORGANIZATION, SYMPTOM, DISEASE, DATE)

---

## 📁 Cấu trúc dự án (Project Structure)

```text
phobert-vietnamese-ner/
├── backend/                 # FastAPI Backend
│   ├── main.py             # API endpoints
│   └── ner_engine.py       # NER inference engine
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React components (Navbar, Sidebar, EntityGraph, ...)
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
├── src/                    # Training & Evaluation scripts
│   ├── dataloader.py       # Xử lý DataLoader và Batching
│   ├── dataset.py          # Class PyTorch Dataset cho NER
│   ├── model.py            # PhoBERT + LoRA + CRF & Training loop
│   ├── test.py             # Đánh giá mô hình trên tập Test
│   ├── inference.py        # CLI inference tool
│   └── augment.py          # Data Augmentation
├── trained_models/         # Thư mục chứa weights (.pt)
│   ├── best_phobert_lora.pt
│   └── phobert-base-v2/
├── PhoNER_COVID19-main/    # Dataset
├── runs/                   # TensorBoard logs
├── requirements.txt        # Python dependencies
└── README.md
```
## 🛠️ Cài đặt môi trường

### 1. Yêu cầu hệ thống
- Python >= 3.10
- Node.js >= 16.x (cho React frontend)
- PyTorch >= 2.0 (Khuyên dùng GPU CUDA để huấn luyện nhanh hơn)

### 2. Các bước cài đặt

**Clone repository:**
```bash
git clone https://github.com/USERNAME/phobert-vietnamese-ner.git
cd phobert-vietnamese-ner
```

**Cài đặt Python dependencies:**
```bash
# Tạo môi trường ảo (Khuyên dùng)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài đặt thư viện Python
pip install -r requirements.txt
```

**Cài đặt Frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

### 3. 📥 Tải Pre-trained Models (Khuyên dùng - Bỏ qua training)

> 💡 **Nếu bạn chỉ muốn test/demo và không có thời gian training**, tải bộ models đã train sẵn từ Google Drive:

**🔗 Download Link:** [Pre-trained Models - Google Drive](https://drive.google.com/drive/folders/1tdACXlSSQkGzdEDCa9EUhtzzRDiHTf1I) `[~1.3GB]`

**Nội dung bao gồm:**
- `best_phobert_lora.pt` - LoRA fine-tuned weights (~50MB)
- `phobert-base-v2/` - PhoBERT base model + tokenizer (~1.2GB)
  - `config.json`
  - `pytorch_model.bin`
  - `tokenizer.json`
  - `bpe.codes`
  - `vocab.txt`

**Hướng dẫn cài đặt:**

1. **Download từ Google Drive:**
   - Click vào link trên
   - Download toàn bộ folder `trained_models`
   - Hoặc download từng file riêng lẻ

2. **Đặt vào đúng vị trí:**
   ```bash
   # Đảm bảo cấu trúc thư mục như sau:
   phobert-vietnamese-ner/
   └── trained_models/
       ├── best_phobert_lora.pt
       └── phobert-base-v2/
           ├── config.json
           ├── pytorch_model.bin
           ├── tokenizer.json
           ├── bpe.codes
           └── vocab.txt
   ```

3. **Verify models đã đúng vị trí:**
   ```bash
   # Linux/Mac:
   ls -lh trained_models/best_phobert_lora.pt
   ls -lh trained_models/phobert-base-v2/
   
   # Windows:
   dir trained_models\best_phobert_lora.pt
   dir trained_models\phobert-base-v2\
   ```

✅ Sau khi có models, bạn có thể [chạy web application](#-quick-start---chạy-web-application) ngay lập tức!

> ⚠️ **Lưu ý:** Nếu không tải models, backend sẽ tự động chạy ở **Demo Mode** với rule-based NER engine (độ chính xác thấp hơn nhưng vẫn hoạt động được để demo UI).

## 📖 Hướng dẫn sử dụng chi tiết (User Guide)

### 🚀 Quick Start - Chạy Web Application

#### 1. Khởi động Backend API
```bash
# Từ thư mục gốc của project
cd backend
python main.py
```
Backend sẽ chạy tại: `http://127.0.0.1:8000`

Kiểm tra API: Mở browser tại `http://127.0.0.1:8000/docs` để xem Swagger API docs

#### 2. Khởi động Frontend
Mở terminal mới:
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

#### 3. Sử dụng ứng dụng
- Mở browser tại `http://localhost:5173`
- Nhập hoặc chọn văn bản tiếng Việt mẫu
- Chọn model (PhoBERT hoặc XLM-RoBERTa) từ dropdown
- Click "Trích xuất NER" để xem kết quả
- Khám phá các tab: displaCy Visualizer, Knowledge Graph, Thống kê & JSON

---

### 🔧 Training & Evaluation

#### Bước 1: Chuẩn bị dữ liệu
Dữ liệu huấn luyện mặc định sử dụng tập **PhoNER_COVID19** (hoặc tập dữ liệu CoNLL format tùy chỉnh).

Đảm bảo file dữ liệu đã được giải nén đúng thư mục:
```
PhoNER_COVID19-main/
├── data/
│   ├── word/
│   │   ├── train_word.conll
│   │   ├── dev_word.conll
│   │   └── test_word.conll
```

#### Bước 2: Huấn luyện mô hình (Training)

**PhoBERT + LoRA + CRF:**
```bash
python src/model.py
```

**XLM-RoBERTa** (nếu có script riêng):
```bash
# Xem notebook: xlmr_model.ipynb
jupyter notebook xlmr_model.ipynb
```

Output: File trọng số tốt nhất được lưu tại `trained_models/best_phobert_lora.pt`

**Theo dõi tiến trình với TensorBoard:**
```bash
tensorboard --logdir runs/phobert_lora_crf_ner
```

#### Bước 3: Đánh giá mô hình (Testing / Evaluation)
Sau khi train xong, chạy script test.py để kiểm thử độ chính xác trên tập Test:

```bash
python src/test.py
```

Kết quả đầu ra:
- Precision, Recall, F1-Score (Micro / Macro)
- Chi tiết cho từng entity type (AGE, DATE, LOCATION, NAME, ORGANIZATION, PATIENT_ID, GENDER, JOB, SYMPTOM, DISEASE)
- Confusion matrix được lưu tại `src/confusion_matrix_result.png`

#### Bước 4: Dự đoán văn bản mới (CLI Inference)
Để chạy dự đoán cho câu tiếng Việt tùy ý bằng command line:

```bash
python src/inference.py --text "Bệnh nhân 1234 (32 tuổi) đang điều trị tại Bệnh viện Chợ Rẫy TP.HCM."
```

Kết quả:
```
[Bệnh_nhân]       -> O
[1234]           -> PATIENT_ID
[(32]            -> O
[tuổi)]          -> AGE
[đang]           -> O
[điều_trị]       -> O
[tại]            -> O
[Bệnh_viện_Chợ_Rẫy] -> ORGANIZATION
[TP.HCM]         -> LOCATION
```

---

### 🎯 Model Selection

Ứng dụng web hỗ trợ chọn giữa 2 models:

| Model | Ưu điểm | Nhược điểm |
|-------|---------|------------|
| **PhoBERT** | - Tối ưu cho tiếng Việt<br>- F1-score cao hơn trên PhoNER COVID-19<br>- Hiểu ngữ cảnh tiếng Việt tốt<br>- ✅ **Pre-trained weights có sẵn** | - Chỉ hỗ trợ tiếng Việt<br>- Cần fine-tune cho domain mới |
| **XLM-RoBERTa** | - Multilingual (100+ languages)<br>- Transfer learning tốt<br>- Không cần word segmentation | - F1-score thấp hơn PhoBERT một chút<br>- Chậm hơn do model size lớn hơn<br>- ⚠️ Cần train hoặc tải từ HuggingFace |

💡 **Khuyến nghị:** 
- Dùng **PhoBERT** cho production với văn bản y tế tiếng Việt (đã có pre-trained weights)
- Dùng **XLM-RoBERTa** khi cần xử lý văn bản đa ngôn ngữ (cần tự train hoặc tải từ HuggingFace)


## 📊 Results And Visualize

### PhoBERT + LoRA + CRF Performance
- **Test F1-Score:** 93.2% (Micro-averaged)
- **Best Validation F1:** 94.1%
- **Training Time:** ~2 hours on RTX 3090

### XLM-RoBERTa Performance
- **Test F1-Score:** 91.8% (Micro-averaged)
- **Advantage:** Zero-shot multilingual capability

### Visualization Examples

<img width="480" height="411" alt="Training Curves - PhoBERT" src="https://github.com/user-attachments/assets/109ce496-177c-408b-ac7a-d5fcc5e3d1a3" />
<img width="480" height="402" alt="Confusion Matrix - PhoBERT" src="https://github.com/user-attachments/assets/27c7b506-2d9c-4a04-8be7-03957f62502f" />
<img width="720" height="360" alt="F1 Scores Comparison" src="https://github.com/user-attachments/assets/bc8e9a95-fd6d-4825-9ae7-a84614c7f104" />
<img width="480" height="411" alt="XLM-RoBERTa Training Curves" src="https://github.com/user-attachments/assets/9de9e444-30c8-4521-ba82-d50cd14b6af0" />
<img width="565" height="365" alt="XLM-RoBERTa Confusion Matrix" src="https://github.com/user-attachments/assets/dba9b7d3-c073-4c18-9f1f-1a13fdb2725f" />

---

## 🌟 Entity Types Supported

| Entity | Description | Example |
|--------|-------------|---------|
| PATIENT_ID | Mã số bệnh nhân | BN1234, bệnh nhân 5678 |
| NAME | Tên người | Nguyễn Văn A |
| AGE | Tuổi | 32 tuổi, 45 tuổi |
| GENDER | Giới tính | nam, nữ |
| JOB | Nghề nghiệp | bác sĩ, kỹ sư, tài xế |
| LOCATION | Địa điểm | Hà Nội, TP.HCM, Đà Nẵng |
| ORGANIZATION | Tổ chức/Bệnh viện | Bệnh viện Chợ Rẫy, Bộ Y tế |
| SYMPTOM | Triệu chứng | sốt cao, ho, khó thở |
| DISEASE | Tên bệnh | COVID-19, viêm phổi, cúm A |
| DATE | Thời gian | ngày 15/08, 20/3/2024 |

---

## 🔗 API Endpoints

### Health Check
```bash
GET http://127.0.0.1:8000/api/health
```

### NER Prediction
```bash
POST http://127.0.0.1:8000/api/predict
Content-Type: application/json

{
  "text": "Bệnh nhân 1234 nam 35 tuổi...",
  "model": "phobert"  // or "xlm-roberta"
}
```

---

## ❓ Troubleshooting

### Backend không load được models
**Triệu chứng:** API health check trả về `"engine": "Smart Demo NER Engine"`

**Nguyên nhân:** Chưa tải models hoặc đặt sai vị trí

**Giải pháp:**
1. Tải models từ [Google Drive](#3--tải-pre-trained-models-khuyên-dùng---bỏ-qua-training)
2. Đảm bảo file `trained_models/best_phobert_lora.pt` tồn tại
3. Đảm bảo thư mục `trained_models/phobert-base-v2/` chứa đầy đủ files
4. Restart backend: `python backend/main.py`

### Frontend không kết nối được Backend
**Triệu chứng:** Loading mãi hoặc lỗi "Failed to fetch"

**Giải pháp:**
1. Kiểm tra Backend đang chạy tại `http://127.0.0.1:8000`
2. Kiểm tra CORS đã được enable trong `backend/main.py`
3. Clear browser cache và refresh

### Model chậm khi inference
**Giải pháp:**
- Dùng GPU nếu có: Cài đặt PyTorch with CUDA
- Giảm batch size nếu chạy trên CPU
- Dùng PhoBERT thay vì XLM-RoBERTa (nhanh hơn)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [PhoBERT](https://github.com/VinAIResearch/PhoBERT) - VinAI Research
- [PhoNER_COVID19](https://github.com/VinAIResearch/PhoNER_COVID19) - Dataset
- [XLM-RoBERTa](https://huggingface.co/xlm-roberta-base) - Facebook AI
- [LoRA](https://github.com/microsoft/LoRA) - Microsoft Research

---

## 📧 Contact

For questions or issues, please open an issue on GitHub or contact the maintainers.

