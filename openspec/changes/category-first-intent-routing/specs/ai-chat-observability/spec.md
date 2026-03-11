## MODIFIED Requirements

### Requirement: He thong phai ghi nhan metric chatbot co cau truc
He thong chatbot MUST ghi nhan metric co cau truc cho moi request, bao gom toi thieu: latency, intent, fallback level, no-match indicator, action click/add-to-cart indicator, va transition context-state (`fromAwaiting`, `toAwaiting`) khi debug mode duoc bat.

#### Scenario: Metric duoc ghi nhan day du cho request thanh cong
- **WHEN** chatbot tra ve response hop le cho user
- **THEN** he thong phai emit metric voi day du field bat buoc va timestamp

#### Scenario: Metric duoc ghi nhan khi fallback
- **WHEN** chatbot su dung fallback chain do LLM loi hoac retrieval khong dat
- **THEN** he thong phai danh dau fallback level va ly do de theo doi chat luong

#### Scenario: Debug transition metadata chi bat o moi truong cho phep
- **WHEN** cau hinh `AI_DEBUG_CONTEXT_ENABLED` la `true`
- **THEN** response co the kem `debugContextId`, `debugFromAwaiting`, `debugToAwaiting` de ho tro truy vet luong hoi thoai

#### Scenario: Production khong bat debug metadata mac dinh
- **WHEN** cau hinh production giu `AI_DEBUG_CONTEXT_ENABLED=false`
- **THEN** response chatbot khong duoc dinh kem cac truong debug transition
