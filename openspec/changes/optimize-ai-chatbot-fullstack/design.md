## Context

Chatbot AI hien tai da co day du capability co ban (intent routing, retrieval, action contract, format rendering), nhung van can toi uu tong the de giam do tre, tang do on dinh, va tang tinh nhat quan giua backend/frontend khi hoi thoai dai.  
Van de thuong gap: response latency dao dong, context co luc lech giua hai phia, va fallback co the lam UX khong lien mach.

Doi ngu can mot dot toi uu co he thong:
- Backend: route nhanh hon, response gon hon, fallback co governance.
- Frontend: state sync chac hon, render va action nhat quan, co fallback an toan.
- Quan sat: KPI chat quality + performance ro rang de tune lien tuc.

## Goals / Non-Goals

**Goals:**
- Giam latency p95 va giam ty le fallback SAFE khong can thiet.
- Dong bo context backend/frontend trong cac flow nhieu turn.
- Toi uu recommendation + action ordering de tang CTR/conversion.
- Chuan hoa format + fallback render de UX de doc tren mobile.
- Bo sung KPI/alert cho hieu nang va mismatch.

**Non-Goals:**
- Khong thay doi he thong admin-human chat.
- Khong huan luyen model rieng hoac them vector DB trong phase nay.
- Khong doi nghiep vu gio hang/checkout core.

## Decisions

### 1) Hybrid fast-path truoc, LLM sau
- **Decision**: Uu tien fast-path rule/retrieval/context-aware cho cac intent high-frequency; chi goi LLM khi can generation linh hoat.
- **Rationale**: Giam chi phi va latency, de du doan hanh vi he thong.
- **Alternative considered**: LLM-first moi request (linh hoat nhung ton chi phi/latency).

### 2) State synchronization contract hai chieu
- **Decision**: Chuan hoa nextContext + action contract de frontend cap nhat state theo response, co fallback khi metadata thieu.
- **Rationale**: Tranh drift context trong flow dai.
- **Alternative considered**: Frontend heuristic tiep tuc tu suy dien state.

### 3) Fallback governance co cap
- **Decision**: Dat cap fallback ro rang (EXACT/RELATED/CATEGORY_BUDGET/SAFE) va quy tac thong diep tuong ung.
- **Rationale**: Tranh tra loi "nhay coc", giu trai nghiem lien mach.
- **Alternative considered**: fallback tu do theo tung nhanh logic.

### 4) Action optimization and chip economy
- **Decision**: Sap xep chip theo uu tien kinh doanh (buy > view > others), cap so chip hien thi, de "xem them".
- **Rationale**: Giam roi UI va tang kha nang bam hanh dong chinh.
- **Alternative considered**: hien thi day du chip.

### 5) Observability-first for continuous tuning
- **Decision**: Theo doi KPI toi thieu: request latency, fallback level distribution, action mismatch, chip CTR, add-to-cart conversion.
- **Rationale**: Co du lieu de ra quyet dinh toi uu tiep theo.
- **Alternative considered**: dua vao feedback cam tinh.

## Risks / Trade-offs

- **[Risk] Toi uu latency lam giam chat luong response** -> **Mitigation**: canh bao quality KPI + golden scenarios regression.
- **[Risk] Metadata contract tang coupling** -> **Mitigation**: versioned optional fields + legacy renderer fallback.
- **[Risk] Chip cap qua chat giam discoverability** -> **Mitigation**: them "xem them" va theo doi CTR.
- **[Risk] Fallback governance qua cung** -> **Mitigation**: cho phep tune by config va A/B test.

## Migration Plan

1. Trien khai backend toi uu fast-path + fallback governance.
2. Mo rong context/action/format metadata contract.
3. Cap nhat frontend state sync + renderer/chip optimization.
4. Chay regression tests va scenario tests.
5. Rollout theo nhip 10% -> 50% -> 100% kem monitor KPI.

## Open Questions

- Gioi han chip toi uu cho mobile nen la 3 hay 4?
- Nguong nao de route sang LLM thay vi fast-path trong cac intent mo?
- Can bo sung persisted server-side AI context trong phase tiep theo khong?
