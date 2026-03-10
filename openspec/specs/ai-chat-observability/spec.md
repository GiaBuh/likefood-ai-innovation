## Purpose
Dat chuan do luong chatbot va theo doi hieu qua recommendation/upsell.

## Requirements

### Requirement: He thong phai ghi nhan metric chatbot co cau truc
He thong chatbot MUST ghi nhan metric co cau truc cho moi request, bao gom toi thieu: latency, intent, fallback level, no-match indicator, action click/add-to-cart indicator.

#### Scenario: Metric duoc ghi nhan day du cho request thanh cong
- **WHEN** chatbot tra ve response hop le cho user
- **THEN** he thong phai emit metric voi day du field bat buoc va timestamp

#### Scenario: Metric duoc ghi nhan khi fallback
- **WHEN** chatbot su dung fallback chain do LLM loi hoac retrieval khong dat
- **THEN** he thong phai danh dau fallback level va ly do de theo doi chat luong

### Requirement: He thong phai ho tro phan tich hieu qua recommendation
He thong SHALL thu thap su kien recommendation exposure va action conversion de danh gia hieu qua goi y mon lien quan va upsell.

#### Scenario: Exposure event duoc ghi khi de xuat duoc hien thi
- **WHEN** response chatbot chua danh sach mon de xuat
- **THEN** he thong phai ghi su kien exposure voi recommendation reason va offer type

#### Scenario: Conversion event duoc ghi khi user thuc hien action
- **WHEN** user bam action them vao gio hoac chot checkout tu chatbot
- **THEN** he thong phai ghi su kien conversion lien ket voi recommendation truoc do
