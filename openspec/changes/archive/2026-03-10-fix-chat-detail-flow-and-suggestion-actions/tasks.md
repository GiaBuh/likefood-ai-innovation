## 1. Backend flow correction for detail follow-up

- [x] 1.1 Cap nhat `AiChatIntentRouter` de nhan dien intent `product_detail_follow_up` khi co selected product context.
- [x] 1.2 Cap nhat `GeminiAiChatServiceImpl` de uu tien nhanh tra loi chi tiet mon thay vi re vao confirmation loop.
- [x] 1.3 Tao helper narrative detail response dua tren product description + CTA nhe, gioi han noi dung khong hallucinate.
- [x] 1.4 Dam bao `nextContext` giu dung selected product trong detail follow-up turn.

## 2. Retrieval and action consistency guardrails

- [x] 2.1 Bo sung validation tai backend: action `open-product`/`buy-product` phai thuoc tap `matchedProductIds` hoac selected product.
- [x] 2.2 Cap nhat retrieval response mapping de khong chen action cho mon ngoai luot retrieval hien tai.
- [x] 2.3 Bo sung metadata ly do goi y de frontend co the hien thi ro rang ngu canh.
- [x] 2.4 Viet test backend cho regression: (a) detail follow-up khong lech flow, (b) wrong action chips bi loai bo.

## 3. Frontend render alignment

- [x] 3.1 Cap nhat `shopApi.ts`/types de dong bo contract action + recommendation metadata moi.
- [x] 3.2 Cap nhat `useChatAi.ts` de loc action khong hop le contract truoc khi render chip.
- [x] 3.3 Dam bao thong diep bot va danh sach chips luon cung ngu canh trong cung mot response.
- [x] 3.4 Them checklist test tay theo 2 nhom bug tu screenshot (anh 1-2 va anh 3-4).

## 4. Verification and rollout

- [x] 4.1 Chay test/build backend + frontend cho luong chat AI.
- [x] 4.2 Thu nghiem toi thieu 10 scenario chat co follow-up detail va recommendation chips.
- [x] 4.3 Theo doi metric no-match/action-mismatch sau deploy va dat nguong canh bao.
- [x] 4.4 Chuan bi rollback nhanh neu phat hien action chips sai ngu canh tren production.
