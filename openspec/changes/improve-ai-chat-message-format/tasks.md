## 1. Backend formatting contract

- [x] 1.1 Bo sung metadata format profile trong AI response (detail/recommendation/budget/simple_cta).
- [x] 1.2 Chuan hoa helper sinh text response theo block (opener, core info, CTA).
- [x] 1.3 Them guardrail do dai response va fallback "xem chi tiet" khi vuot nguong.
- [x] 1.4 Bo sung test backend cho format profile va text readability rule.

## 2. Frontend rendering and chip presentation

- [x] 2.1 Cap nhat `shopApi.ts` va chat types de nhan format metadata moi.
- [x] 2.2 Cap nhat `useChatAi.ts` de dua metadata vao renderer va fallback khi metadata thieu.
- [x] 2.3 Cap nhat `ChatMessageList.tsx` de render text block de doc hon (xuong dong/bullet style).
- [x] 2.4 Trien khai chip grouping + chip cap + "xem them" cho truong hop nhieu action.

## 3. UX polish and consistency

- [x] 3.1 Chuan hoa spacing/line-height cua bot bubble de giam cam giac roi.
- [x] 3.2 Dam bao recommendation text va chips luon cung ngu canh trong cung message card.
- [x] 3.3 Them fallback format cho response legacy de khong vo UI.
- [x] 3.4 Cap nhat checklist test tay cho readability tren mobile viewport.

## 4. Verification and rollout

- [x] 4.1 Chay build frontend + test backend lien quan chat formatting.
- [x] 4.2 Thu nghiem toi thieu 10 kịch bản chat co detail/recommendation/budget.
- [x] 4.3 Theo doi metric CTR chips, action mismatch, va feedback readability.
- [x] 4.4 Chuan bi rollback flag neu format moi gay giam conversion.
