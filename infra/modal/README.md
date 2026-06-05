# Modal batch functions

Python functions for burst AI batch jobs. Called via HTTP from apps/api or Render workers.

## Auth
Every endpoint verifies `Authorization: Bearer $SERVICE_TOKEN` before executing.

## Functions
- `bulk_loyalty.py` — send birthday/re-engagement messages to past guests
- `bulk_autofill.py` — AI autofill event pages for multiple chefs at once

## Deploy
```bash
modal deploy bulk_loyalty.py
modal deploy bulk_autofill.py
```

Copy the printed web endpoint URLs to your .env:
- MODAL_APP_BULK_LOYALTY_URL
- MODAL_APP_BULK_AUTOFILL_URL
