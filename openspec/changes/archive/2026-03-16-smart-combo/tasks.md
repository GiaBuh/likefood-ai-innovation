## Phase 1: Backend — ComboCampaign items + public API

- [x] 1.1 Add `items` field (TEXT, JSON array) to `ComboCampaign` entity
- [x] 1.2 Update `ComboCampaignService.generateComboCampaign()` to save items from request
- [x] 1.3 Update `ComboGenerateRequestDto` to include items list (already had items)
- [x] 1.4 Add `GET /ai/combos/published` public endpoint (no auth, status=PUBLISHED, sort by createdAt desc)
- [x] 1.5 Add `GET /ai/combos/{id}` public endpoint for combo detail
- [x] 1.6 Backend build test (Docker build passed)

## Phase 2: Frontend Admin — Smart Combo Generator

- [x] 2.1 Add scoring logic: `score = stock / (totalSoldCount + 1)` for each product
- [x] 2.2 Redesign AiComboGenerator with 2 tabs: "Đề xuất thông minh" + "Chọn thủ công"
- [x] 2.3 Tab 1: Ranked product list with scores, auto-select top 3, "Nên chọn 2-3 SP" hint
- [x] 2.4 Tab 2: Keep existing checkbox flow
- [x] 2.5 Send items (product names) in generateAiCombo API call
- [x] 2.6 Frontend build test (vite build passed 2.71s)

## Phase 3: Frontend Customer — Combo Showcase Page

- [x] 3.1 Add `getPublishedCombos()` and `getComboDetail()` to shopApi.ts
- [x] 3.2 Create `ComboPage.tsx` — hero section, grid of combo cards (banner, name, slogan, discount badge)
- [x] 3.3 Combo detail expand/modal — show products in combo with thumbnails + "Xem SP" link
- [x] 3.4 Empty state when no published combos
- [x] 3.5 Update route: `/about` → `/combo` in App.tsx (with redirect)
- [x] 3.6 Update Header navigation: "Giới thiệu" → "Combo"
- [x] 3.7 Update Footer + MobileBottomNav links
- [x] 3.8 Frontend build test (passed)

## Phase 4: Verification

- [x] 4.1 Full build (make build — all 5 containers running)
- [x] 4.2 Browser test: Admin smart combo tab — scoring and auto-select verified
- [x] 4.3 Browser test: Combo page — hero + empty state displayed correctly
- [ ] 4.4 Browser test: Dark mode combo page
- [ ] 4.5 Browser test: Generate combo → verify items saved
