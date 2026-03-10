## Purpose
Dinh nghia hop dong response action giua backend/frontend de frontend render dung nhiem vu tiep theo, khong lech danh sach.

## Requirements

### Requirement: Backend response phai dinh nghia action contract nhat quan voi matched products
He thong chatbot SHALL tra ve actions co lien ket hop le voi `matchedProductIds` hoac `selectedProductId` trong context cua cung response.

#### Scenario: Action list va matched products trung nhau
- **WHEN** backend tra ve `actions` cho luot chat recommendation/detail
- **THEN** moi action co `productId` phai nam trong `matchedProductIds` hoac bang `selectedProductId` dang active

### Requirement: Frontend phai render action an toan theo contract
Frontend MUST bo qua action khong hop le contract (thieu productId hoac productId khong thuoc tap hop hop le), va MUST khong hien thi chip khong lien quan.

#### Scenario: Nhan action sai ngu canh tu backend
- **WHEN** frontend nhan duoc action chips co `productId` khong nam trong tap product hop le cua response
- **THEN** frontend phai loai bo cac chip do va chi hien thi action hop le con lai
