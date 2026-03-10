## ADDED Requirements

### Requirement: Fallback phai theo cap va thong diep nhat quan
He thong chatbot SHALL su dung cap fallback ro rang (`EXACT`, `RELATED`, `CATEGORY_BUDGET`, `SAFE`) va tra thong diep phu hop tung cap.

#### Scenario: Chuyen cap fallback
- **WHEN** ket qua retrieval giam chat luong tu exact sang related/category/safe
- **THEN** response phai danh dau fallback level va giai thich ly do o muc phu hop

### Requirement: Fallback SAFE khong duoc mat dinh huong mua hang
He thong MUST cung cap huong dan tiep theo ro rang trong fallback SAFE de nguoi dung khong bi dead-end.

#### Scenario: Khong tim thay mon phu hop
- **WHEN** he thong vao fallback SAFE
- **THEN** bot phai dat cau hoi goi mo preference tiep theo (vi du budget/category/taste)
