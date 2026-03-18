## Why

The frontend fails to verify VNPay return responses, showing an `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` error. This occurs because the `/payments` API route is missing from both the Nginx proxy configuration and the Vite development proxy configuration. As a result, the dev server and production proxy treat the API call as a frontend route, returning the `index.html` SPA fallback instead of forwarding the request to the backend.

## What Changes

- Add `payments` to the API proxy regular expression in `frontend/nginx.conf`.
- Add a proxy rule for `/payments` pointing to the backend in `frontend/vite.config.ts`.

## Capabilities

### New Capabilities
- `api-proxy-routing`: Proper routing of payment API endpoints through the frontend proxy.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**: `frontend/nginx.conf`, `frontend/vite.config.ts`
- **Systems**: Modifies the routing behavior of the frontend server (both in development via Vite and in production via Nginx) to properly forward payment-related API calls to the backend.
