# 🇻🇳 PhoBERT + LoRA + CRF for Vietnamese Named Entity Recognition (NER)

Dự án huấn luyện mô hình Nhận dạng Thực thể Tên (NER) trên tiếng Việt bằng cách kết hợp **PhoBERT**, kỹ thuật tinh chỉnh tham số hiệu quả **LoRA (Low-Rank Adaptation)** và lớp điều kiện ngẫu nhiên **CRF (Conditional Random Field)**.

---

## 📌 Tính năng nổi bật (Features)

- **Kiến trúc tối ưu:** PhoBERT-base-v2 + LoRA (tiết kiệm bộ nhớ GPU) + CRF Layer (tăng chính xác trình tự nhãn NER).
- **Tiền xử lý & Tách từ:** Sử dụng `pyvi` / `vncorenlp` cho văn bản tiếng Việt.
- **Trực quan hóa:** Tích hợp logging qua TensorBoard, tự động xuất đồ thị Training Loss, F1-Score và Confusion Matrix.

---

## 📁 Cấu trúc dự án (Project Structure)

```text
phobert-vietnamese-ner/
├── src/
│   ├── dataloader.py        # Xử lý DataLoader và Batching
│   ├── dataset.py           # Class PyTorch Dataset cho NER
│   ├── model.py             # Định nghĩa kiến trúc PhoBERT + LoRA + CRF & Vòng lặp Train
│   ├── test.py              # Đánh giá mô hình trên tập Test
│   ├── inference.py         # Dự đoán nhãn NER cho văn bản tùy chỉnh
│   └── augment.py           # Tăng cường dữ liệu (Data Augmentation)
├── trained_models/          # Thư mục chứa weights (.pt) sau khi train
├── runs/                    # File log của TensorBoard
├── confusion_matrix.png     # Ảnh Ma trận nhầm lẫn
├── phoner_covid19_lora_f1_scores.png # Đồ thị F1-Score
├── requirements.txt         # Danh sách thư viện cần thiết
└── README.md
```
## 🛠️ Cài đặt môi trường
1. Yêu cầu hệ thống
Python >= 3.10

PyTorch >= 2.0 (Khuyên dùng GPU CUDA để huấn luyện nhanh hơn)

2. Các bước cài đặt
Clone dự án về máy và cài đặt các thư viện cần thiết:
# Clone repository
git clone [https://github.com/USERNAME/phobert-vietnamese-ner.git](https://github.com/USERNAME/phobert-vietnamese-ner.git)
cd phobert-vietnamese-ner

# Tạo môi trường ảo (Khuyên dùng)
python -m venv venv
source venv/bin/activate  # Trên Windows dùng: venv\Scripts\activate

# Cài đặt thư viện
pip install -r requirements.txt

## 📖 Hướng dẫn sử dụng chi tiết (User Guide)
- Bước 1: Chuẩn bị dữ liệu
Dữ liệu huấn luyện mặc định sử dụng tập dữ liệu PhoNER_COVID19 (hoặc tập dữ liệu CoNLL format tùy chỉnh).
Đảm bảo file dữ liệu đã được giải nén đúng thư mục dữ liệu đầu vào.

- Bước 2: Huấn luyện mô hình (Training)
Chạy script huấn luyện chính. Mô hình sẽ tự động tính toán Validation Loss/F1 sau mỗi Epoch và lưu lại Checkpoint tốt nhất:

python src/model.py

Output: File trọng số tốt nhất được lưu tại trained_models/best_phobert_lora.pt.

Theo dõi tiến trình: Bạn có thể mở TensorBoard để xem biểu đồ Loss theo thời gian thực:

Bash
tensorboard --logdir runs/phobert_lora_crf_ner

- Bước 3: Đánh giá mô hình (Testing / Evaluation)
Sau khi train xong, chạy script test.py để kiểm thử độ chính xác trên tập dữ liệu độc lập (Test Set):

Bash
python src/test.py
Kết quả đầu ra sẽ hiển thị bảng báo cáo chi tiết:

Các chỉ số Precision, Recall, F1-Score tổng thể (Micro / Macro F1).

Chỉ số chi tiết cho từng loại thực thể (AGE, DATE, LOCATION, NAME, ORGANIZATION, PATIENT_ID, ...).

- Bước 4: Dự đoán văn bản mới (Inference)
Để chạy dự đoán cho một hoặc nhiều câu tiếng Việt tùy ý, bạn dùng script inference.py:

Bash
python src/inference.py --text "Bệnh nhân 1234 (32 tuổi) đang điều trị tại Bệnh viện Chợ Rẫy TP.HCM."
Trích xuất kết quả dự đoán:

Plaintext
[Bệnh_nhân]       -> O
[1234]           -> PATIENT_ID
[(32]            -> O
[tuổi)]          -> AGE
[đang]           -> O
[điều_trị]       -> O
[tại]            -> O
[Bệnh_viện_Chợ_Rẫy] -> LOCATION
[TP.HCM]         -> LOCATION

## Result And Visualize
<img width="480" height="411" alt="765187046_28006279508984500_513813700124642708_n" src="https://github.com/user-attachments/assets/109ce496-177c-408b-ac7a-d5fcc5e3d1a3" />
<img width="480" height="402" alt="765460074_1009379175330505_2404254830113339420_n" src="https://github.com/user-attachments/assets/27c7b506-2d9c-4a04-8be7-03957f62502f" />
<img width="720" height="360" alt="765068925_1035081822607147_1465304685770446125_n" src="https://github.com/user-attachments/assets/bc8e9a95-fd6d-4825-9ae7-a84614c7f104" />
<img width="480" height="411" alt="765351190_2555499021562963_5361058901700670072_n" src="https://github.com/user-attachments/assets/9de9e444-30c8-4521-ba82-d50cd14b6af0" />
<img width="565" height="365" alt="766072515_3381951175321134_3760178432500091036_n" src="https://github.com/user-attachments/assets/dba9b7d3-c073-4c18-9f1f-1a13fdb2725f" />

