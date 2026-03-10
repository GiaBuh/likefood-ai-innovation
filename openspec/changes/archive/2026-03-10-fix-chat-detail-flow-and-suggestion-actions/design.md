## Context

User report tu UI screenshot cho thay 2 van de:
- Bot bi lech luong khi user hoi tiep ve mon vua duoc de cap (dang tu "hoi chi tiet" quay ve "xac nhan mua").
- Noi dung tra loi co the dung, nhung action chips ben duoi lai tro den mon khong lien quan.

He thong hien tai co backend sinh `reply + actions + nextContext` va frontend render lai theo contract do. Vi vay bug can xu ly dong thoi o:
- Intent/context routing de phan biet "detail follow-up" voi "buy confirmation".
- Action mapping contract de frontend chi hien thi actions trung voi ket qua retrieval cua luot hien tai.

## Goals / Non-Goals

**Goals:**
- Dung luong follow-up "mon do la mon gi / noi ro hon ve mon do" de bot tra loi mo ta san pham va copy ban hang.
- Dam bao action chips sau moi response AI chi gom mon hop le trong cung tap ket qua retrieval.
- Chuan hoa data flow ro rang: user message -> backend process -> response contract -> frontend render.
- Them tests de ngan regression cho 2 bug da ghi nhan.

**Non-Goals:**
- Khong doi tong the UI widget chat.
- Khong mo rong sang recommendation trong checkout modal.
- Khong thay doi auth/session architecture.

## Decisions

### 1) Uu tien intent detail-follow-up khi co selectedProduct context
- **Decision**: Neu `nextContext.selectedProductId` ton tai va user message la hoi-thong-tin (`chi tiet`, `mon do la mon gi`, `noi ro hon`), route vao detail explanation flow thay vi confirmation flow.
- **Rationale**: Giai quyet truc tiep bug anh 1-2 va giu hoi thoai tu nhien.
- **Alternative considered**: Tiep tuc dua vao generic affirmative/negative detection (de sai intent).

### 2) Tach response generation thanh 2 phan: narrative va actions binding
- **Decision**: Backend tao narrative text dua tren product description truoc, sau do bind actions theo tap `matchedProductIds` cua cung response.
- **Rationale**: Loai bo tinh trang text dung nhung action sai ngu canh.
- **Alternative considered**: Frontend tu loc lai actions (khong du context retrieval va de sai lech).

### 3) Action guardrail bat buoc
- **Decision**: Moi `open-product`/`buy-product` action MUST co `productId` nam trong `matchedProductIds` cua response hoac la selected product trong context.
- **Rationale**: Chan hoan toan bug anh 3-4.
- **Alternative considered**: Chi log warning khi sai (khong ngan duoc loi runtime cho user).

### 4) Product detail persuasion template
- **Decision**: Them template sinh cau tra loi detail theo mo ta san pham (taste/use-case/why-buy) + CTA nhe.
- **Rationale**: Dat yeu cau business "them mam them muoi, kich thich mua" nhung khong hallucinates.
- **Alternative considered**: Dung prompt tong quat khong ro cau truc (chat luong copy khong on dinh).

### 5) Frontend render ngu canh theo response contract
- **Decision**: Frontend se render action tu backend nhung bo qua action khong hop le (khong co productId hoac khong thuoc matched set).
- **Rationale**: Defense-in-depth neu backend co loi edge-case.
- **Alternative considered**: Trust 100% backend action list.

## Risks / Trade-offs

- **[Risk] Loi classify intent detail trong cau ngan** -> **Mitigation**: bo sung dictionary phrase + fallback hoi lai 1 cau clarifying.
- **[Risk] Loc action qua chat lam giam co hoi upsell** -> **Mitigation**: cho phep upsell action chi khi co `offerType=upsell` va relation score dat nguong.
- **[Risk] Copy ban hang de qua muc** -> **Mitigation**: gioi han do dai va cam ket dung thong tin tu mo ta co san.

## Migration Plan

1. Cap nhat backend intent routing + detail flow processing.
2. Cap nhat backend action binding guardrail.
3. Cap nhat frontend action rendering filter.
4. Them tests cho 2 loi regression (detail follow-up + wrong chips).
5. Rollout qua feature flag neu can, theo doi logs chat trong 24-48h.

## Open Questions

- Co can them tone presets cho detail persuasion theo nhom san pham (do bien, do kho, banh, hat) o phase nay khong?
- Muc do CTA toi da 1 hay 2 cau de tranh cam giac spam?
