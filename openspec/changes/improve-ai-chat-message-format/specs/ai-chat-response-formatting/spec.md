## ADDED Requirements

### Requirement: Bot response phai theo cau truc de doc nhanh
He thong chatbot SHALL tra loi theo cau truc ngan gon gom opener, thong tin chinh, va CTA, thay vi doan van lien tuc.

#### Scenario: Response detail duoc format theo block
- **WHEN** bot tra loi mo ta chi tiet mon
- **THEN** message phai co opener ngan, noi dung chinh duoc xuong dong ro rang, va CTA cuoi thong diep

### Requirement: Bot response phai co guardrail do dai
He thong MUST gioi han do dai hien thi cho moi message theo profile format, va MUST cung cap huong mo rong thong tin khi vuot nguong.

#### Scenario: Response qua dai duoc rut gon
- **WHEN** noi dung bot vuot nguong do dai cho phep trong chat card
- **THEN** he thong phai rut gon phan hien thi va de xuat action "xem chi tiet" hoac tuong duong
