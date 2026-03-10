## ADDED Requirements

### Requirement: He thong phai uu tien fast-path cho intent tan suat cao
He thong chatbot SHALL uu tien xu ly bang rule/retrieval/context-aware fast-path truoc khi can nhac goi LLM doi voi cac intent tan suat cao.

#### Scenario: Fast-path xu ly thanh cong
- **WHEN** message nguoi dung thuoc tap intent co the xu ly bang rule/retrieval
- **THEN** he thong phai tra response ma khong can goi LLM

### Requirement: He thong phai theo doi va gioi han latency theo KPI
He thong MUST ghi nhan latency theo intent/fallback level va MUST cung cap co che canh bao khi vuot nguong p95 dat ra.

#### Scenario: Vuot nguong latency
- **WHEN** p95 latency vuot nguong cau hinh trong khoang thoi gian giam sat
- **THEN** he thong phai phat sinh canh bao de toi uu tiep theo
