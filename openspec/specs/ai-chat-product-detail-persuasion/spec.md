## Purpose
Dinh nghia hanh vi tra loi chi tiet + thuyet phuc mua hang khi user hoi tiep ve mon dang duoc de cap.

## Requirements

### Requirement: Bot phai tra loi detail follow-up theo dung mon dang duoc noi den
He thong chatbot SHALL uu tien xu ly intent hoi chi tiet khi nguoi dung hoi tiep ve "mon do" trong context da co selected product, va MUST tra loi bang thong tin mo ta cua chinh san pham do.

#### Scenario: User hoi "mon do la mon gi" sau khi bot nhac den mon
- **WHEN** context co `selectedProductId` va user gui thong diep hoi chi tiet mon vua nhac
- **THEN** chatbot phai tra loi mo ta cua dung san pham `selectedProductId`, khong reset ve flow xac nhan mua mac dinh

### Requirement: Bot detail response phai co narrative ban hang + CTA nhe
He thong chatbot MUST tao cau tra loi detail co noi dung hap dan mua hang dua tren du lieu co that cua product description, va SHOULD ket thuc bang mot CTA nhe de tiep tuc mua hang.

#### Scenario: Detail response duoc viet theo style thuyet phuc
- **WHEN** chatbot sinh detail response cho mon dang duoc chon
- **THEN** response phai gom toi thieu 1 y mo ta chat luong/huong vi va 1 cau goi mo hanh dong tiep theo (xem chi tiet hoac mua)
