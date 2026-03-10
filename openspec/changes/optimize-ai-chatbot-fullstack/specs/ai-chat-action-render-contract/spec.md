## MODIFIED Requirements

### Requirement: Backend response phai dinh nghia action contract nhat quan voi matched products
He thong chatbot SHALL tra ve actions co lien ket hop le voi `matchedProductIds` hoac `selectedProductId` trong context cua cung response, dong thoi SHOULD bo sung metadata format de frontend render dung layout.

#### Scenario: Action list va matched products trung nhau
- **WHEN** backend tra ve `actions` cho luot chat recommendation/detail
- **THEN** moi action co `productId` phai nam trong `matchedProductIds` hoac bang `selectedProductId` dang active

#### Scenario: Backend gui format metadata
- **WHEN** backend sinh response cho detail/recommendation/budget
- **THEN** response phai co metadata format profile phu hop de frontend chon template render

#### Scenario: Backend gui chip ordering hint
- **WHEN** response co nhieu action chips
- **THEN** backend phai cung cap du thong tin de frontend uu tien `buy` truoc `view` va `other`

### Requirement: Frontend phai render action an toan theo contract
Frontend MUST bo qua action khong hop le contract (thieu productId hoac productId khong thuoc tap hop hop le), va MUST khong hien thi chip khong lien quan.

#### Scenario: Nhan action sai ngu canh tu backend
- **WHEN** frontend nhan duoc action chips co `productId` khong nam trong tap product hop le cua response
- **THEN** frontend phai loai bo cac chip do va chi hien thi action hop le con lai

#### Scenario: Metadata format thieu hoac khong hop le
- **WHEN** frontend nhan response khong co metadata format
- **THEN** frontend phai fallback ve renderer mac dinh de dam bao UI van de doc
