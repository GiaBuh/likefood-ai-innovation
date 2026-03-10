## MODIFIED Requirements

### Requirement: Intent router phai xu ly cac intent mua hang co ban theo rule-first
He thong chatbot SHALL phan loai message vao bo intent co ban truoc khi goi LLM, bao gom toi thieu: `product_search`, `related_recommendation`, `add_to_cart`, `variant_selection`, `quantity_update`, `checkout_confirmation`, `greeting_help`, `budget_constraint`, `out_of_stock_alternative`, `product_detail_follow_up`, `unknown`.

#### Scenario: Intent duoc nhan dien bang rule ma khong can goi LLM
- **WHEN** nguoi dung gui message khop pattern cua intent co ban
- **THEN** he thong phai route truc tiep sang luong xu ly intent tuong ung ma khong bat buoc goi LLM

#### Scenario: Intent khong ro rang duoc gan unknown va xu ly an toan
- **WHEN** nguoi dung gui message khong du thong tin hoac khong khop bo rule hien co
- **THEN** he thong phai gan intent `unknown` va tra loi hoi lai preference thay vi sinh hanh dong mua hang sai

#### Scenario: Uu tien intent detail follow-up khi co selected product
- **WHEN** context dang co `selectedProductId` va nguoi dung hoi theo kieu "mon do la mon gi", "chi tiet hon", "noi ro mon do"
- **THEN** he thong phai gan intent `product_detail_follow_up` thay vi nhay vao nhanh xac nhan mua

### Requirement: Intent router phai duy tri context hoi thoai cho cac buoc tiep theo
He thong chatbot MUST giu trang thai context toi thieu cho cac buoc cho xac nhan mon, bien the, so luong va checkout de xu ly message follow-up dung ngu canh.

#### Scenario: Follow-up message duoc hieu theo context dang cho
- **WHEN** context dang o trang thai cho nhap so luong
- **THEN** message la mot con so phai duoc hieu la cap nhat so luong thay vi tim kiem mon moi

#### Scenario: Follow-up detail message duoc giu cung context mon da chon
- **WHEN** context co `selectedProductId` va user tiep tuc hoi thong tin ve mon do
- **THEN** he thong phai giu nguyen `selectedProductId` trong next context de duy tri luong hoi dap chi tiet
