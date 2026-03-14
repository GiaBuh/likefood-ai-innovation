## Why

Khi chuyển đổi ngôn ngữ VI ↔ EN, các yếu tố typography và layout bị ảnh hưởng nghiêm trọng:
- **Độ dài text khác nhau**: Tiếng Việt thường dài hơn tiếng Anh (do dấu) hoặc ngắn hơn (do từ vựng), gây vỡ layout
- **Phông chữ**: Tiếng Việt có dấu (ă, ê, ơ, ư, ả, ã...) cần vertical space nhiều hơn
- **Cỡ chữ**: Dấu tiếng Việt có thể bị cắt (clip) nếu line-height quá thấp
- **Nút/Button overflow**: Text dịch sang ngôn ngữ khác có thể dài hơn, tràn ra ngoài button
- **Navigation**: Menu items có thể khác chiều dài, gây lệch layout

## What Changes

- Kiểm tra toàn bộ UI khi switch VI → EN và EN → VI
- Audit typography: dấu tiếng Việt không bị cắt, line-height đủ
- Audit layout: buttons, nav links, modals, cards không bị overflow
- Audit mobile: text dài không gây horizontal scroll
- Sửa các lỗi phát hiện được

## Capabilities

### New Capabilities
- `typography-audit`: Kiểm tra phông chữ, cỡ chữ, dấu tiếng Việt không bị cắt
- `layout-overflow-audit`: Kiểm tra text tràn, button overflow, nav link alignment
- `component-text-audit`: Kiểm tra từng component với cả 2 ngôn ngữ
- `mobile-text-audit`: Kiểm tra layout text trên mobile (320px, 375px)

### Modified Capabilities
_None — testing only._

## Impact

- **Frontend**: Tất cả components có i18n
- **Sửa code** nếu phát hiện overflow, clipping, hoặc layout breaking
