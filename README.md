# PhoBERT và XLM-RoBERTa cho NER tiếng Việt trong ngữ cảnh COVID-19

Dự án xây dựng, so sánh và triển khai mô hình **Named Entity Recognition (NER)** cho văn bản tiếng Việt liên quan đến dịch COVID-19. Hai mô hình được fine-tune trên bộ dữ liệu **PhoNER_COVID19** là:

- **PhoBERT-base-v2 + LoRA + CRF** — mô hình tiếng Việt chuyên biệt.
- **XLM-RoBERTa-base + LoRA + CRF** — mô hình đa ngôn ngữ để đối chiếu và hỗ trợ kịch bản mở rộng sang ngôn ngữ khác.

Ngoài pipeline huấn luyện, repository có ứng dụng demo gồm FastAPI và React để nhập văn bản, chọn mô hình, xem thực thể được tô sáng, biểu đồ quan hệ và JSON kết quả.

> Lưu ý: đây là dự án nghiên cứu/demo. Kết quả NER không thay thế việc xác minh nghiệp vụ hoặc quyết định y khoa.

## Mục lục

- [Bài toán và dữ liệu](#bài-toán-và-dữ-liệu)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt và chạy demo](#cài-đặt-và-chạy-demo)
- [Tải model đã huấn luyện sẵn](#tải-model-đã-huấn-luyện-sẵn)
- [Khởi chạy ứng dụng web](#khởi-chạy-ứng-dụng-web)
- [Huấn luyện và đánh giá](#huấn-luyện-và-đánh-giá)
- [Nhóm thực hiện](#nhóm-thực-hiện---uet---vnu)

## Bài toán và dữ liệu

NER là bài toán gán nhãn cho từng token trong câu và ghép các token liên tiếp thành thực thể có nghĩa. Ví dụ, với câu `Bệnh nhân 1234, 32 tuổi, điều trị tại Bệnh viện Chợ Rẫy ngày 15/08`, mô hình có thể nhận ra mã bệnh nhân, tuổi, tổ chức và thời gian.

Dữ liệu đầu vào sử dụng định dạng CoNLL: mỗi dòng chứa một token và nhãn BIO tương ứng; các câu được ngăn bởi dòng trống. Pipeline hiện dùng phiên bản `word` của PhoNER_COVID19. Bộ nhãn xuất hiện trong notebook gồm:

`LOCATION`, `GENDER`, `SYMPTOM_AND_DISEASE`, `PATIENT_ID`, `TRANSPORTATION`, `DATE`, `NAME`, `ORGANIZATION`, `AGE`, `JOB`.

Quy ước BIO đánh dấu biên thực thể: `B-` là token mở đầu, `I-` là token tiếp diễn và `O` là token ngoài thực thể. Vì nhãn `O` và một số lớp như `JOB` phân bố không cân bằng, đánh giá chính dựa trên F1 ở cấp thực thể thay vì accuracy đơn thuần.

## Cấu trúc thư mục

```text
phobert-vietnamese-ner/
├── backend/                         # FastAPI phục vụ suy luận
│   ├── main.py                       # Khai báo API, CORS và endpoint
│   └── ner_engine.py                 # Load/switch PhoBERT hoặc XLM-R, hậu xử lý span
├── frontend/                         # Giao diện React + Vite
│   ├── src/
│   │   ├── components/               # Highlight, graph, dossier, JSON, sidebar, ...
│   │   ├── App.jsx                   # Màn hình ứng dụng chính
│   │   └── main.jsx                  # Điểm khởi chạy React
│   ├── public/figures/               # Tài nguyên minh họa cho frontend
│   └── package.json                  # Scripts và dependencies JavaScript
├── scripts/                          # Script huấn luyện độc lập
│   ├── train_phobert.py              # PhoBERT + LoRA + CRF
│   └── train_xlmr.py                 # XLM-RoBERTa + LoRA + CRF
├── src/                              # Thành phần dùng chung cho training
│   ├── dataloader.py                 # Đọc CoNLL thành Hugging Face Dataset
│   └── augment.py                    # Tăng cường dữ liệu bằng hoán đổi thực thể
├── PhoNER_COVID19-main/              # Dữ liệu và hướng dẫn gán nhãn gốc
│   └── data/
│       ├── word/                     # train/dev/test dạng word-level (.conll, .json)
│       └── syllable/                 # train/dev/test dạng syllable-level
├── trained_models/                   # Checkpoint và tokenizer cục bộ (không nên commit weights lớn)
│   ├── phobert-base-v2/              # Tokenizer/cấu hình PhoBERT cục bộ
│   └── xlm-roberta/                  # Adapter/tokenizer XLM-R cục bộ
├── report                            # Báo cáo dự án
├── figures/                          # Hình được sinh từ notebook phân tích
├── model_comparison.ipynb            # EDA, train và so sánh hai mô hình
├── requirements.txt                  # Dependencies Python
└── README.md
```

Một số thư mục như `runs/` (TensorBoard) và checkpoint tốt nhất có thể được tạo khi train. Chúng không nhất thiết tồn tại ở bản clone mới.

## Cài đặt và chạy demo

### Yêu cầu

- Python 3.10+ (khuyến nghị có GPU CUDA khi huấn luyện)
- Node.js 16+ và npm (để chạy frontend)

### Cài đặt dependencies

```bash
git clone <repository-url>
cd phobert-vietnamese-ner

python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd frontend
npm install
cd ..
```

### Tải model đã huấn luyện sẵn

Nếu chỉ muốn test hoặc demo mà không có thời gian huấn luyện, hãy tải bộ model đã train sẵn từ Google Drive: [Pre-trained Models – Google Drive](https://drive.google.com/drive/folders/1tdACXlSSQkGzdEDCa9EUhtzzRDiHTf1I?usp=drive_link) (khoảng 2,1 GB).

Bộ tải xuống gồm:

- `best_phobert_lora.pt`: checkpoint PhoBERT + LoRA + CRF đã fine-tune (khoảng 546 MB).
- `phobert-base-v2/`: PhoBERT base model và tokenizer (khoảng 521 MB), bao gồm `config.json`, `pytorch_model.bin`, `tokenizer.json`, `bpe.codes` và `vocab.txt`.
- `best_xlmr_lora.pt`: checkpoint XLMR + LoRA + CRF đã fine-tune (khoảng 1.04 GB).
- `xlm-roberta/`: XLM-RoBERTa base model và tokenizer (khoảng 18 MB), bao gồm `adapter_config.json`, `adapter_model.safetensors`, `tokenizer.json` và `tokenizer_config.json`.

Tải toàn bộ thư mục `trained_models` (hoặc từng tệp tương ứng) rồi đặt tại thư mục gốc của dự án theo cấu trúc sau:

```text
phobert-vietnamese-ner/
└── trained_models/
    ├── best_phobert_lora.pt
    └── phobert-base-v2/
        ├── config.json
        ├── pytorch_model.bin
        ├── tokenizer.json
        ├── bpe.codes
        └── vocab.txt
    ... (tương tự cho XLM-RoBERTa)
```

Có thể kiểm tra nhanh vị trí file trước khi chạy backend:

```bash
# Linux/macOS
ls -lh trained_models/best_phobert_lora.pt
ls -lh trained_models/phobert-base-v2/

# Windows PowerShell hoặc Command Prompt
dir trained_models\best_phobert_lora.pt
dir trained_models\phobert-base-v2\
```

Khi các tệp trên đã đúng vị trí, bạn có thể chạy ứng dụng web ngay. Nếu chưa tải model, backend vẫn chạy ở **Smart Demo Mode** với rule-based NER engine để demo giao diện; kết quả ở chế độ này có độ chính xác thấp hơn và không phải dự đoán của mô hình neural.

### Khởi chạy ứng dụng web

Mở hai terminal ở thư mục gốc dự án.

```bash
# Terminal 1: backend
cd backend
python main.py
```

API chạy tại `http://127.0.0.1:8000`; Swagger UI tại `http://127.0.0.1:8000/docs`.

```bash
# Terminal 2: frontend
cd frontend
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (thường là `http://localhost:5173`). Người dùng có thể chọn `phobert` hoặc `xlm-roberta`, nhập văn bản và xem thực thể được đánh dấu.

Endpoint suy luận:

```bash
POST http://127.0.0.1:8000/api/predict
Content-Type: application/json

{
  "text": "Bệnh nhân 1234, 32 tuổi, điều trị tại Bệnh viện Chợ Rẫy.",
  "model": "phobert"
}
```

`GET /api/health` cho biết checkpoint nào đang khả dụng. Khi checkpoint cục bộ chưa có, backend chuyển sang **Smart Demo Mode** dùng luật; kết quả ở chế độ này không phải dự đoán của mô hình neural.

## Huấn luyện và đánh giá

Dữ liệu mặc định nằm ở `PhoNER_COVID19-main/data/word/` với ba file `train_word.conll`, `dev_word.conll` và `test_word.conll`.

```bash
# Huấn luyện PhoBERT + LoRA + CRF
python scripts/train_phobert.py

# Huấn luyện XLM-RoBERTa + LoRA + CRF
python scripts/train_xlmr.py
```

Hai script sẽ tải backbone từ Hugging Face nếu chưa có cache, ghi TensorBoard log vào `runs/` và lưu checkpoint vào `trained_models/`. Có thể theo dõi log bằng:

```bash
tensorboard --logdir runs
```

Để xem chi tiết phân tích phân phối dữ liệu (EDA) và trực quan hóa kết quả (Confusion Matrix, F1 Score theo từng thực thể), sử dụng file [model_comparison.ipynb](model_comparison.ipynb).

## Nhóm thực hiện - UET - VNU

- Hoàng Công Khôi — 24022371 
- Trương Huy Hoàng — 24022341
- Phạm Danh Thái — 24022449

## License

Mã nguồn được phát hành theo [MIT License](LICENSE). Dữ liệu và các mô hình tiền huấn luyện tuân theo điều khoản của nguồn phát hành tương ứng.
