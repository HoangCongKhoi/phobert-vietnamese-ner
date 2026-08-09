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
