import os
from datasets import Dataset


def read_phoner_file(file_path):
    #Đọc file CoNLL của PhoNER_COVID19 từ thư mục data/word/
    sentences = []
    labels = []

    with open(file_path, 'r', encoding='utf-8') as f:
        tokens, tags = [], []
        for line in f:
            line = line.strip()
            if not line:
                if tokens:
                    sentences.append(tokens)
                    labels.append(tags)
                    tokens, tags = [], []
            else:
                parts = line.split()
                if len(parts) >= 2:
                    tokens.append(parts[0])
                    tags.append(parts[1])
        if tokens:
            sentences.append(tokens)
            labels.append(tags)

    return Dataset.from_dict({"tokens": sentences, "ner_tags": labels})


def load_phoner_dataset(data_dir):
    #Load toàn bộ
    train_ds = read_phoner_file(os.path.join(data_dir, "train_word.conll"))
    dev_ds = read_phoner_file(os.path.join(data_dir, "dev_word.conll"))
    test_ds = read_phoner_file(os.path.join(data_dir, "test_word.conll"))
    return train_ds, dev_ds, test_ds