## Purpose
Toi uu upsell trong chat voi gioi han tan suat, chong lap va phu hop ngu canh mua hang.

## Requirements

### Requirement: Upsell phai co gioi han tan suat va so luong de xuat
He thong chatbot SHALL chi de xuat toi da 2 mon bo sung trong moi luot de xuat va MUST khong lap lai cung mot de xuat upsell trong cua so hoi thoai ngan.

#### Scenario: Gioi han so luong upsell duoc ap dung
- **WHEN** he thong xac dinh duoc nhieu mon co the upsell
- **THEN** chatbot chi duoc hien thi toi da 2 de xuat bo sung uu tien cao nhat

#### Scenario: Chong lap de xuat trong hoi thoai gan
- **WHEN** san pham da duoc upsell cho nguoi dung trong cua so nhieu luot chat lien tiep
- **THEN** he thong phai uu tien mon bo sung khac hoac bo qua upsell

### Requirement: Upsell phai phu hop ngu canh mua hang
He thong MUST chi kich hoat upsell khi intent mua hang da ro rang hoac sau khi da tim thay mon phu hop, va SHOULD uu tien mon bo tro theo category/combination logic.

#### Scenario: Kich hoat upsell sau khi tim thay mon chinh
- **WHEN** nguoi dung da chon hoac xac nhan mon chinh
- **THEN** chatbot duoc phep de xuat mon bo sung co tinh bo tro va con hang

#### Scenario: Khong kich hoat upsell khi intent chua ro
- **WHEN** intent hien tai la unknown hoac user dang hoi thong tin chung
- **THEN** he thong khong duoc dua de xuat upsell de tranh gay nhieu
