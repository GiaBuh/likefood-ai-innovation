## MODIFIED Requirements

### Requirement: Intent router phai xu ly cac intent mua hang co ban theo rule-first
He thong chatbot SHALL phan loai message vao bo intent co ban truoc khi goi LLM, bao gom toi thieu: `category_search`, `product_search`, `related_recommendation`, `add_to_cart`, `variant_selection`, `quantity_update`, `checkout_confirmation`, `greeting_help`, `budget_constraint`, `out_of_stock_alternative`, `product_detail_follow_up`, `unknown`.

#### Scenario: Intent duoc nhan dien bang rule ma khong can goi LLM
- **WHEN** nguoi dung gui message khop pattern cua intent co ban
- **THEN** he thong phai route truc tiep sang luong xu ly intent tuong ung ma khong bat buoc goi LLM

#### Scenario: Intent khong ro rang duoc gan unknown va xu ly an toan
- **WHEN** nguoi dung gui message khong du thong tin hoac khong khop bo rule hien co
- **THEN** he thong phai gan intent `unknown` va tra loi hoi lai preference thay vi sinh hanh dong mua hang sai

#### Scenario: Uu tien intent detail follow-up khi co selected product
- **WHEN** context dang co `selectedProductId` va nguoi dung hoi theo kieu "mon do la mon gi", "chi tiet hon", "noi ro mon do"
- **THEN** he thong phai gan intent `product_detail_follow_up` thay vi nhay vao nhanh xac nhan mua

#### Scenario: Uu tien category_search truoc product_search
- **WHEN** message cua user dong thoi co dau hieu category va token product mo rong
- **THEN** he thong phai gan intent `category_search` truoc va chi fallback sang `product_search` neu category khong hop le
