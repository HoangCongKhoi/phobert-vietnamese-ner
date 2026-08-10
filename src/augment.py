import random
import os
from copy import deepcopy
from dataloader import load_phoner_dataset

# Danh sách từ vựng bổ sung cho nhãn JOB
JOB_DICTIONARY = [
    ["bác_sĩ"],
    ["y_bác_sĩ"],
    ["nữ_hộ_sinh"],
    ["dược_sĩ"],
    ["kỹ_sư"],
    ["công_nhân"],
    ["tài_xế"],
    ["tài_xế_công_nghệ"],
    ["bảo_vệ"],
    ["nhân_viên_giao_hàng"],
    ["nhân_viên_y_tế"],
    ["giáo_viên"],
    ["học_sinh"],
    ["sinh_viên"],
    ["kinh_doanh_tự_do"],
    ["buôn_bán"],
    ["thợ_hàn"],
    ["cán_bộ"],
]


def augment_entity_swap(dataset, target_label="JOB", num_augments_per_sentence=2):
    augmented_tokens = []
    augmented_tags = []

    for tokens, tags in zip(dataset["tokens"], dataset["ner_tags"]):
        has_target = any(target_label in tag for tag in tags)
        if has_target:
            for _ in range(num_augments_per_sentence):
                new_tokens = list(tokens)
                new_tags = list(tags)
                i = 0
                while i < len(new_tags):
                    if new_tags[i] == f"B-{target_label}":
                        start_idx = i
                        end_idx = i + 1
                        while end_idx < len(new_tags) and new_tags[end_idx] == f"I-{target_label}":
                            end_idx += 1
                        replacement_job = random.choice(JOB_DICTIONARY)
                        replacement_tags = [f"B-{target_label}"] + [f"I-{target_label}"] * (len(replacement_job) - 1)
                        new_tokens = new_tokens[:start_idx] + replacement_job + new_tokens[end_idx:]
                        new_tags = new_tags[:start_idx] + replacement_tags + new_tags[end_idx:]
                        i = start_idx + len(replacement_job)
                    else:
                        i += 1
                augmented_tokens.append(new_tokens)
                augmented_tags.append(new_tags)
    return augmented_tokens, augmented_tags


if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, "PhoNER_COVID19-main", "data", "word")

    train_dataset, _, _ = load_phoner_dataset(DATA_DIR)

    aug_tokens, aug_tags = augment_entity_swap(train_dataset, target_label="JOB", num_augments_per_sentence=3)

    if aug_tokens:
        print("\n--- MẪU CÂU SAU KHI AUGMENT ---")
        print("Tokens:", aug_tokens[0])
        print("Tags:  ", aug_tags[0])