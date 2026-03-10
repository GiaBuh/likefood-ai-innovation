## ADDED Requirements

### Requirement: Backend va frontend phai dong bo context hoi thoai nhat quan
He thong chatbot SHALL duy tri nextContext nhat quan sau moi response de frontend cap nhat state chinh xac trong cac flow nhieu turn.

#### Scenario: Context hop le duoc dong bo
- **WHEN** backend tra ve response co nextContext
- **THEN** frontend phai cap nhat state theo nextContext va tiep tuc flow dung ngu canh

### Requirement: He thong phai co fallback khi context metadata thieu
Frontend MUST co renderer/state fallback an toan khi metadata context khong day du, va MUST khong vo flow hoi thoai.

#### Scenario: Metadata context bi thieu
- **WHEN** response khong co du field context can thiet
- **THEN** frontend phai fallback ve state an toan va tiep tuc hoi dap ma khong crash
