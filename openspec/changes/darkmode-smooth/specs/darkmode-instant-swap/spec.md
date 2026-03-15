## ADDED Requirements

### Requirement: Dark mode toggle mượt không lag
Hệ thống SHALL chuyển đổi dark/light mode mà không gây hiện tượng lag/jank trên giao diện. Transition SHALL duy trì 60fps.

#### Scenario: Chuyển từ light sang dark
- **WHEN** user click toggle dark mode khi đang ở light mode
- **THEN** một overlay với background trắng SHALL xuất hiện phủ viewport, theme SHALL chuyển sang dark ngay lập tức, overlay SHALL fade out trong 0.3s để lộ ra theme tối

#### Scenario: Chuyển từ dark sang light
- **WHEN** user click toggle dark mode khi đang ở dark mode
- **THEN** một overlay với background tối SHALL xuất hiện phủ viewport, theme SHALL chuyển sang light ngay lập tức, overlay SHALL fade out trong 0.3s để lộ ra theme sáng

#### Scenario: Click liên tục không bị lỗi
- **WHEN** user click toggle liên tục nhiều lần
- **THEN** overlay cũ SHALL bị xóa trước khi tạo overlay mới, không có overlay nào bị lắng đọng trên DOM
