## ADDED Requirements

### Requirement: Action chips phai duoc nhom va sap xep theo uu tien
Frontend SHALL sap xep action chips theo nhom hanh dong de nguoi dung nhin de hieu: mua, xem chi tiet, hanh dong tiep theo.

#### Scenario: Bot tra nhieu chips trong mot response
- **WHEN** response co nhieu action chips
- **THEN** frontend phai sap chips theo thu tu uu tien va giu nhat quan giua cac luot chat

### Requirement: Action chips phai gioi han mat do hien thi
Frontend MUST gioi han so chips hien thi truc tiep trong mot bot message va MUST cung cap cach mo rong phan con lai neu vuot nguong.

#### Scenario: So chips vuot nguong
- **WHEN** response co so action chips lon hon gioi han hien thi
- **THEN** frontend chi hien thi chips uu tien va cung cap co che "xem them"
