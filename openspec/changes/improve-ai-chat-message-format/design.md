## Context

Qua trai nghiem thuc te, noi dung bot hien thi trong chat widget con kho doc: doan text dai, xuong dong khong nhat quan, chen thong tin ky thuat vao cung mot khoi, va chips ben duoi khong duoc nhom ro.  
Mat do thong tin cao tren man hinh nho lam nguoi dung mat tap trung va giam kha nang bam hanh dong tiep theo.

Chat flow hien tai da on ve logic, nen phase nay tap trung vao format va presentation contract:
- Backend xac dinh kieu noi dung + metadata format.
- Frontend render theo pattern giao dien thong nhat.

## Goals / Non-Goals

**Goals:**
- Chuan hoa text bot de de doc trong mobile chat card.
- Chuan hoa format danh sach/goi y/gia theo block nhat quan.
- Nhom action chips theo muc dich (xem, mua, tiep theo) va gioi han so luong hien thi.
- Tao fallback format an toan khi noi dung dai hoac thieu du lieu.
- Bao toan y nghia kinh doanh (thuyet phuc mua) nhung khong roi.

**Non-Goals:**
- Khong thay doi logic retrieval/ranking cot loi.
- Khong thay doi websocket/admin chat.
- Khong doi brand guideline tong the cua app.

## Decisions

### 1) Response formatting profile tu backend
- **Decision**: Backend tra ve them metadata format profile (`compact_detail`, `recommendation_list`, `budget_advice`, `simple_cta`) de frontend render theo mau.
- **Rationale**: Tach trach nhiem noi dung va presentation, tranh frontend doan format bang heuristic.
- **Alternative considered**: Frontend tu parse text thuong de format (khong on dinh).

### 2) Message block structure
- **Decision**: Moi response bot uu tien 3 phan toi da: opener ngan, core info dang bullet/line break, CTA 1 cau.
- **Rationale**: De doc nhanh va de bam action tiep theo.
- **Alternative considered**: Doan van lien tuc (kho scan tren mobile).

### 3) Action chip grouping and cap
- **Decision**: Gioi han chip hien thi theo cap (vd toi da 4 chip uu tien), sap theo thu tu `buy` -> `view detail` -> `other`, phan con lai dua vao "Xem them".
- **Rationale**: Giam roi mat, tang click vao hanh dong chinh.
- **Alternative considered**: Hien thi full chips ngay (qua tai UI).

### 4) Defensive render layer
- **Decision**: Frontend duy tri bo loc action contract va bo sung renderer fallback neu metadata format thieu.
- **Rationale**: Chiu loi tot, khong vo UI khi backend response khong day du.
- **Alternative considered**: Bat buoc metadata day du 100% (de gay loi runtime khi du lieu xau).

### 5) Readability guardrails
- **Decision**: Dat quy tac do dai: moi message <= N dong uu tien, neu dai thi rut gon + show "xem chi tiet".
- **Rationale**: Tranh text wall.
- **Alternative considered**: Khong gioi han do dai (van roi).

## Risks / Trade-offs

- **[Risk] Format qua gon lam mat thong tin** -> **Mitigation**: giu nut "xem chi tiet" va profile `compact_detail`.
- **[Risk] Tang coupling contract backend/frontend** -> **Mitigation**: metadata optional + fallback renderer.
- **[Risk] Sap chip theo uu tien co the bo sot edge-case** -> **Mitigation**: theo doi CTR va co "xem them".

## Migration Plan

1. Mo rong response metadata format profile o backend.
2. Cap nhat frontend renderer cho text blocks + grouped chips.
3. Boi tri fallback renderer cho response cu.
4. Test tay tren mobile viewport voi 10+ kịch bản.
5. Rollout va theo doi CTR + action mismatch + feedback.

## Open Questions

- Nen dat mac dinh gioi han bao nhieu chip/response de can bang giua gon va du thong tin?
- Co can switch style theo ngon ngu (`vi`/`en`) hay dung chung mot profile?
