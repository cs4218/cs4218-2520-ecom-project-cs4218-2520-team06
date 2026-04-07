# Story 1 Manual Checklist: Braintree Hosted Fields

## Goal
Verify PCI-sensitive card data is captured only by Braintree Hosted Fields and never by the application server.

## Frontend Checklist
- Confirm card number, CVV, and expiry inputs are rendered using Braintree Hosted Fields iframes, not plain HTML inputs.
- Inspect network requests from browser to app backend and verify checkout payload includes nonce/token only.
- Confirm no request payload from frontend to backend contains raw values like cardNumber, cvv, or expirationDate.
- Confirm browser localStorage/sessionStorage/cookies do not persist raw card values.

## Backend Checklist
- Verify `/api/v1/product/braintree/payment` accepts and processes tokenized data (`nonce`) and ignores/rejects raw card fields.
- Confirm application logs do not contain raw PAN/CVV/expiry on payment failures.
- Confirm order persistence does not store cardNumber/CVV/expiry fields in payment records.
- Confirm API responses never echo raw card details back to clients.

## Evidence to Capture
- Screenshot of Hosted Fields implementation in browser DevTools Elements panel.
- Network capture showing tokenized checkout payload.
- Log snippets showing no raw card values during checkout success/failure.
- Order document sample proving absence of raw PCI fields.
