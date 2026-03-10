## Purpose
Quy dinh retrieval mon lien quan theo fallback chain va rang buoc ton kho, ngan sach.

## Requirements

### Requirement: He thong phai tim mon theo fallback chain co thu tu uu tien
He thong chatbot SHALL tim va de xuat mon theo thu tu: exact match -> related match -> category/budget suggestions -> safe response.

#### Scenario: Tim thay exact match
- **WHEN** co san pham active trung khop ten hoac token chinh voi message nguoi dung
- **THEN** he thong phai uu tien tra exact match truoc khi de xuat cac mon related

#### Scenario: Khong co exact match thi de xuat mon related
- **WHEN** khong tim thay exact match cho mon nguoi dung yeu cau
- **THEN** he thong phai tra danh sach mon related dua tren keyword/category/price band va neu ly do goi y

#### Scenario: Khong co ket qua retrieval thi tra loi safe va hoi lai
- **WHEN** ca exact va related retrieval deu khong co ket qua hop le
- **THEN** he thong phai tra safe response co huong dan nguoi dung bo sung preference (vi du budget, loai mon)

### Requirement: Retrieval phai ton trong rang buoc ton kho va gia
He thong MUST loai bo san pham khong con ban hoac bien the het hang khi de xuat, va MUST ap dung budget filter neu nguoi dung co neu ngan sach.

#### Scenario: San pham het hang khong duoc dua vao de xuat
- **WHEN** san pham match keyword nhung khong con variant con hang
- **THEN** he thong phai bo qua san pham do va de xuat lua chon con hang gan nhat

#### Scenario: Budget filter duoc ap dung
- **WHEN** nguoi dung neu ngan sach toi da
- **THEN** he thong phai uu tien va tra ve cac san pham co gia nam trong budget truoc

#### Scenario: Action suggestion phai thuoc cung tap retrieval
- **WHEN** chatbot tra ve danh sach actions "xem/mua" sau khi retrieval
- **THEN** moi action `productId` phai thuoc tap `matchedProductIds` cua response (hoac selected product context), khong duoc chen mon ngoai tap do
