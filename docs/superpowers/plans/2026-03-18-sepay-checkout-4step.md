# SePay Checkout 4-Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BANK_TRANSFER VNPay flow with SePay while keeping COD intact, and deliver 4-step checkout where order success is decoupled from payment success.

**Architecture:** Backend creates order first, marks BANK_TRANSFER payment as `FAILED` by default, and returns SePay checkout form payload. Frontend Step 3 submits order and opens SePay in new tab, then moves to Step 4 immediately. SePay IPN/callback updates payment to `PAID` when approved.

**Tech Stack:** Spring Boot 3 (Java), React + TypeScript, SePay Payment Gateway/IPN, MySQL (JPA update), existing RestResponse wrapper.

---

### Task 1: Backend payment model + config foundation

**Files:**
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/domain/Order.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/repository/OrderRepository.java`
- Create: `backend/src/main/java/com/ecommerce/likefood/payment/sepay/config/SepayProperties.java`

- [ ] **Step 1: Add failing test skeleton for new order payment reference behavior**

```java
// backend/src/test/java/com/ecommerce/likefood/order/service/impl/OrderServiceImplSepayTest.java
// skeleton test file with TODO test methods and assertions for paymentRef assignment
```

- [ ] **Step 2: Run test to verify failure (class/method missing)**

Run: `cd backend && ./gradlew test --tests "*OrderServiceImplSepayTest"`
Expected: FAIL (missing symbols / missing setup)

- [ ] **Step 3: Implement model/config changes**

- Add SePay property keys and binding class
- Add `paymentRef` (+ optional `paymentGateway`) to `Order`
- Add repository finder by `paymentRef`

- [ ] **Step 4: Compile backend to verify no syntax errors**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/application.yml \
  backend/src/main/java/com/ecommerce/likefood/order/domain/Order.java \
  backend/src/main/java/com/ecommerce/likefood/order/repository/OrderRepository.java \
  backend/src/main/java/com/ecommerce/likefood/payment/sepay/config/SepayProperties.java \
  backend/src/test/java/com/ecommerce/likefood/order/service/impl/OrderServiceImplSepayTest.java
git commit -m "feat(payment): add sepay config and order payment reference fields"
```

### Task 2: Backend SePay checkout payload generation + order creation flow

**Files:**
- Create: `backend/src/main/java/com/ecommerce/likefood/payment/sepay/service/SepayCheckoutService.java`
- Create: `backend/src/main/java/com/ecommerce/likefood/payment/sepay/dto/SepayCheckoutPayload.java`
- Create: `backend/src/main/java/com/ecommerce/likefood/order/dto/res/OrderCheckoutResponse.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/service/OrderService.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/service/impl/OrderServiceImpl.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/controller/OrderController.java`

- [ ] **Step 1: Write failing tests for BANK_TRANSFER create-order response**

```java
// Assert: paymentRequired=true, paymentUrl/action payload exists,
// order paymentStatus defaults to FAILED for BANK_TRANSFER.
```

- [ ] **Step 2: Run targeted tests and verify fail**

Run: `cd backend && ./gradlew test --tests "*OrderServiceImplSepayTest"`
Expected: FAIL

- [ ] **Step 3: Implement SePay payload + order branching**

- For COD: keep current behavior
- For BANK_TRANSFER: generate `paymentRef`, set paymentStatus `FAILED`, build signed SePay form payload
- Return unified checkout response

- [ ] **Step 4: Re-run targeted tests**

Run: `cd backend && ./gradlew test --tests "*OrderServiceImplSepayTest"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/ecommerce/likefood/payment/sepay/service/SepayCheckoutService.java \
  backend/src/main/java/com/ecommerce/likefood/payment/sepay/dto/SepayCheckoutPayload.java \
  backend/src/main/java/com/ecommerce/likefood/order/dto/res/OrderCheckoutResponse.java \
  backend/src/main/java/com/ecommerce/likefood/order/service/OrderService.java \
  backend/src/main/java/com/ecommerce/likefood/order/service/impl/OrderServiceImpl.java \
  backend/src/main/java/com/ecommerce/likefood/order/controller/OrderController.java
git commit -m "feat(order): return sepay checkout payload for bank transfer"
```

### Task 3: Backend SePay callback/IPN and retry payment

**Files:**
- Create: `backend/src/main/java/com/ecommerce/likefood/payment/sepay/controller/SepayWebhookController.java`
- Create: `backend/src/main/java/com/ecommerce/likefood/payment/sepay/dto/SepayIpnRequest.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/common/config/SecurityConfiguration.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/service/OrderService.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/service/impl/OrderServiceImpl.java`
- Modify: `backend/src/main/java/com/ecommerce/likefood/order/controller/OrderController.java`

- [ ] **Step 1: Write failing tests for IPN update and retry URL**

```java
// Assert IPN approved => order paymentStatus PAID
// Assert retry endpoint returns sepay form payload for unpaid BANK_TRANSFER order
```

- [ ] **Step 2: Run tests and verify fail**

Run: `cd backend && ./gradlew test --tests "*OrderServiceImplSepayTest"`
Expected: FAIL

- [ ] **Step 3: Implement webhook + retry behavior**

- Verify `X-Secret-Key`
- Parse order invoice/payment reference
- Update order `PAID` when approved
- Add authenticated retry endpoint

- [ ] **Step 4: Run backend test suite**

Run: `cd backend && ./gradlew test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/ecommerce/likefood/payment/sepay/controller/SepayWebhookController.java \
  backend/src/main/java/com/ecommerce/likefood/payment/sepay/dto/SepayIpnRequest.java \
  backend/src/main/java/com/ecommerce/likefood/common/config/SecurityConfiguration.java \
  backend/src/main/java/com/ecommerce/likefood/order/service/OrderService.java \
  backend/src/main/java/com/ecommerce/likefood/order/service/impl/OrderServiceImpl.java \
  backend/src/main/java/com/ecommerce/likefood/order/controller/OrderController.java
git commit -m "feat(payment): handle sepay ipn and retry payment"
```

### Task 4: Frontend service layer for checkout payload + SePay form submit

**Files:**
- Modify: `frontend/services/shopApi.ts`
- Modify: `frontend/contexts/ShopContext.tsx`
- Modify: `frontend/types.ts`

- [ ] **Step 1: Add failing TypeScript checks (new response shape usage)**

```ts
// Update types to intentionally require checkout response fields
// so old createOrderFromMyCart call sites fail until migrated.
```

- [ ] **Step 2: Run frontend build to verify fail**

Run: `cd frontend && npm run build`
Expected: FAIL (type errors)

- [ ] **Step 3: Implement API + context changes**

- Parse new create-order response shape
- Return order + payment payload to checkout UI
- Add utility to open/submit SePay form in new tab

- [ ] **Step 4: Re-run frontend build**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add frontend/services/shopApi.ts frontend/contexts/ShopContext.tsx frontend/types.ts
git commit -m "feat(frontend): support sepay checkout payload in shop service"
```

### Task 5: Frontend 4-step checkout UI + callback page

**Files:**
- Modify: `frontend/components/checkout/CheckoutStepper.tsx`
- Modify: `frontend/components/checkout/Checkout.tsx`
- Modify: `frontend/components/checkout/ShippingForm.tsx`
- Modify: `frontend/components/checkout/OrderSuccess.tsx`
- Create: `frontend/components/checkout/PaymentStep.tsx`
- Create: `frontend/components/checkout/SepayReturnPage.tsx`
- Modify: `frontend/App.tsx`
- Modify: `frontend/locales/vi.json`
- Modify: `frontend/locales/en.json`

- [ ] **Step 1: Add failing UI flow checks manually (step transitions)**

- Verify current app has only 3 steps and no payment step (baseline)

- [ ] **Step 2: Implement 4-step UI and payment branch behavior**

- Add payment method selection step
- COD => Step 4 directly
- BANK_TRANSFER => open SePay tab + Step 4 immediately
- Step 4 shows payment-not-completed message for unpaid states

- [ ] **Step 3: Implement SePay callback route handling**

- Parse callback query
- Trigger refresh of orders/payment state
- Show callback status message

- [ ] **Step 4: Run frontend build and smoke-check**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add frontend/components/checkout/CheckoutStepper.tsx \
  frontend/components/checkout/Checkout.tsx \
  frontend/components/checkout/ShippingForm.tsx \
  frontend/components/checkout/OrderSuccess.tsx \
  frontend/components/checkout/PaymentStep.tsx \
  frontend/components/checkout/SepayReturnPage.tsx \
  frontend/App.tsx frontend/locales/vi.json frontend/locales/en.json
git commit -m "feat(checkout): add 4-step flow with sepay payment step"
```

### Task 6: Full verification and cleanup

**Files:**
- Modify: none (verification only unless bugfix needed)

- [ ] **Step 1: Run backend tests**

Run: `cd backend && ./gradlew test`
Expected: PASS

- [ ] **Step 2: Run frontend production build**

Run: `cd frontend && npm run build`
Expected: PASS

- [ ] **Step 3: Capture final diff and summarize behavior changes**

Run: `git status --short && git diff --stat`
Expected: only intended files modified

- [ ] **Step 4: Final commit for any verification fixes (if needed)**

```bash
git add <fix-files>
git commit -m "fix: finalize sepay checkout integration"
```
