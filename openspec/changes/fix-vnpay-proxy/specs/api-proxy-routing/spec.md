## ADDED Requirements

### Requirement: Route Payment APIs
The frontend proxy SHALL forward requests starting with `/payments` to the backend API server.

#### Scenario: VNPay Return Callback
- **WHEN** the frontend makes a fetch request to `/payments/vnpay/return`
- **THEN** the proxy forwards the request to the backend server instead of serving the SPA `index.html` fallback.
