## Context

The system consists of a Vite/React frontend and a Spring Boot backend. In production, the frontend is served via an Nginx reverse proxy which also routes API requests to the backend. Currently, the Nginx configuration and Vite dev server configuration specify exact path prefixes for proxying, but they omit the `/payments` prefix used for VNPay callbacks.

## Goals / Non-Goals

**Goals:**
- Ensure `/payments/*` API calls from the frontend correctly reach the backend.
- Fix the JSON parsing errors on the frontend checkout/return page without altering backend logic.

**Non-Goals:**
- Refactoring the VNPay backend integration.
- Changing authentication mechanisms.

## Decisions

- **Update Nginx Regex**: Modify the `location ~ ^/(auth|...)(/|$)` block in `nginx.conf` to include `payments`. This is the simplest and most robust fix for the production environment.
- **Update Vite Config**: Add a proxy rule for `/payments` in `vite.config.ts`. This ensures developers testing locally with Vite also encounter proper routing behavior, matching production.

## Risks / Trade-offs

- **Risk**: Modifying the Nginx regex might accidentally expose internal routes if not careful.
  - **Mitigation**: We are strictly appending `|payments` to the existing capturing group, which only affects routes starting with `/payments`.
