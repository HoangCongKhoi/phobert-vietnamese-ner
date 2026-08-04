import torch
from torch.utils.data import Dataset


def tokenize_and_align_labels(tokenizer, examples, label2id, max_length=128):
    """
    examples format:
    {
        "tokens": [["Bác", "Sĩ", "Lê", "Văn", "A", "ở", "Hà", "Nội"], ...],
        "ner_tags": [["O", "O", "B-PER", "I-PER", "I-PER", "O", "B-LOC", "I-LOC"], ...]
    }
    """
    tokenized_inputs = tokenizer(
        examples["tokens"],
        is_split_into_words=True,
        padding="max_length",
        truncation=True,
        max_length=max_length,
        return_tensors="pt"
    )

    all_labels = []
    for i, labels in enumerate(examples["ner_tags"]):
        word_ids = tokenized_inputs.word_ids(batch_index=i)
        previous_word_idx = None
        label_ids = []

        for word_idx in word_ids:
            if word_idx is None:
                label_ids.append(-100)
            elif word_idx != previous_word_idx:
                label_ids.append(label2id[labels[word_idx]])
            else:
                label_ids.append(-100)

            previous_word_idx = word_idx

        all_labels.append(label_ids)

    tokenized_inputs["labels"] = torch.tensor(all_labels)
    return tokenized_inputs