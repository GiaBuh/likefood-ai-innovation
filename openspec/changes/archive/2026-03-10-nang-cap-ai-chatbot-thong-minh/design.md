## Context

He thong chatbot hien tai da co backend orchestration (`GeminiAiChatServiceImpl`) va frontend state machine (`useChatAi.ts`) cho cac buoc add-to-cart/variant/quantity/checkout.  
Tuy nhien logic tim mon va goi y mon lien quan van phu thuoc nhieu vao prompt va keyword scoring co ban, dan den ket qua khong on dinh khi khach dien dat da dang hoac khi khong co exact match.

Rang buoc cua phase nay:
- Uu tien chi phi va do tre: khong duoc day toan bo xu ly sang LLM.
- Ho tro tieng Viet va tieng Anh co ban.
- Khong thay doi luong mua hang cot loi cua frontend (nut action, add-to-cart, checkout), chi nang cap chat luong quyet dinh va response metadata.

Stakeholders:
- Khach hang dat mon qua chatbot.
- Team business can tang add-to-cart conversion.
- Team engineering can co metric ro rang de theo doi chat luong chatbot.

## Goals / Non-Goals

**Goals:**
- Dinh nghia pipeline `intent-router -> retrieval/ranking -> planner` de xu ly on dinh cac intent co ban.
- Dinh nghia fallback chain bat buoc khi khong co exact match.
- Dinh nghia chien luoc upsell/cross-sell co gioi han va dieu kien kich hoat.
- Dinh nghia response contract mo rong de frontend hien thi ly do goi y ro rang.
- Dinh nghia metric va logging de do no-match, fallback, latency, va conversion.

**Non-Goals:**
- Khong trien khai vector database hoac huan luyen model rieng trong phase dau.
- Khong thay doi toan bo UI chat widget.
- Khong mo rong sang support ticket workflow cua admin-human chat.

## Decisions

### 1) Rule-first intent routing truoc LLM
- **Decision**: Dung bo intent routing deterministic cho cac nhom intent co tan suat cao (tim mon, de xuat lien quan, add-to-cart, quantity/variant, checkout, greeting/help, out-of-stock alternative).
- **Rationale**: Giam so lan goi LLM, giam latency, de debug va de benchmark chat luong.
- **Alternative considered**:
  - LLM-first cho moi message: linh hoat hon nhung chi phi/latency cao va kho kiem soat.
  - Rule-only: re va nhanh nhung kem kha nang xu ly cau hoi phuc tap.

### 2) Retrieval/ranking service tach rieng khoi service orchestration
- **Decision**: Tach logic tim exact + related product + budget/category filtering thanh mot service backend rieng (co the tai su dung cho checkout recommendation).
- **Rationale**: Don gian hoa `GeminiAiChatServiceImpl`, tang kha nang test theo scenario, va tranh duplicate logic giua backend/frontend.
- **Alternative considered**:
  - Giu tat ca trong `GeminiAiChatServiceImpl`: nhanh truoc mat nhung tiep tuc tao class qua lon va kho bao tri.

### 3) Fallback chain bat buoc theo thu tu uu tien
- **Decision**: Ap dung chuoi fallback sau cho moi request tim/goi y:
  1. exact match theo ten/chuan hoa token
  2. related match theo keyword/category/price band
  3. category + budget suggestions
  4. safe answer + hoi lai preference
- **Rationale**: Dam bao chatbot luon tra loi co gia tri va giam dead-end.
- **Alternative considered**:
  - Nhay thang tu exact sang safe answer: giam huong dan mua hang, bo lo co hoi cross-sell.

### 4) Upsell guardrail theo ngu canh
- **Decision**: Chi de xuat toi da 1-2 mon bo sung, chi kich hoat khi:
  - da xac dinh duoc mon chinh hoac intent mua ro rang
  - mon bo sung con hang va khac nhom voi mon chinh (uu tien bo tro)
  - khong lap lai de xuat trong cua so hoi thoai ngan
- **Rationale**: Tang conversion ma khong tao cam giac spam.
- **Alternative considered**:
  - Upsell moi luot hoi thoai: co the tang exposure nhung de gay kho chiu cho nguoi dung.

### 5) Response contract mo rong metadata
- **Decision**: Bo sung metadata recommendation trong `AiChatResponse` (vi du: `reason`, `offerType`, `fallbackLevel`, `confidenceBand`) ben canh action hien co.
- **Rationale**: Frontend can thong tin giai thich vi sao de xuat, dong thoi ho tro phan tich KPI.
- **Alternative considered**:
  - Nhung ly do vao plain text reply: kho parse va kho do luong.

### 6) Observability va KPI bat buoc
- **Decision**: Them event logging/metric cho:
  - request latency
  - intent distribution
  - no-match rate
  - fallback-level rate
  - action click/add-to-cart conversion
- **Rationale**: Co so lieu de danh gia “thong minh hon” theo thuc nghiem.
- **Alternative considered**:
  - Chi dung log text: kho tong hop va kho canh bao.

## Risks / Trade-offs

- **[Risk] Rule set qua chat khong bao phu du intent da dang** -> **Mitigation**: Dat bo intent toi thieu >=10 scenario, theo doi `unknown_intent_rate` va cap nhat dinh ky.
- **[Risk] Them metadata lam tang coupling frontend/backend** -> **Mitigation**: Dat field optional, versioned contract, co fallback hien thi khi metadata vang.
- **[Risk] Ranking heuristics co the lech theo nganh hang** -> **Mitigation**: Parameter hoa trong config, cho phep tune weight theo A/B.
- **[Risk] Them metric co the tang overhead** -> **Mitigation**: Sample event khi tai cao, giu payload nhe va khong ghi PII nhay cam.

## Migration Plan

1. Mo rong contract response backend voi truong metadata optional (khong breaking).
2. Trien khai retrieval/ranking service moi song song logic cu; cho phep feature-flag de rollback nhanh.
3. Chuyen `GeminiAiChatServiceImpl` sang pipeline moi theo tung nhanh intent.
4. Cap nhat frontend `useChatAi.ts` va `shopApi.ts` de su dung metadata neu co, fallback ve behavior cu neu khong co.
5. Bat metric dashboard va alert co ban.
6. Rollout theo ty le nho (internal -> 10% -> 50% -> 100%), theo doi KPI va rollback qua flag neu fallback/no-match xau di.

## Open Questions

- Co can phan biet bo intent theo phan khuc user (moi vs quay lai) ngay trong phase dau khong?
- Nguong toi uu cho `confidenceBand` de kich hoat upsell nen dat mac dinh bao nhieu?
- Can giu local fallback frontend o muc nao sau khi backend retrieval da on dinh?
