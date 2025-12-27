---
description: Deploy updates and force mobile refresh
---

When you make changes to the main code and want them to reflect on the mobile app, follow these steps:

1. **Increment Service Worker Version**
   - Open `sw.js`.
   - Update `CACHE_NAME` (e.g., from `work-order-v6` to `work-order-v7`).
   - This is CRITICAL for mobile devices to know there is a new version.

2. **Commit Changes**
   - Run: `git add .`
   - Run: `git commit -m "Description of your changes"`

3. **Push to GitHub**
// turbo
   - Run: `git push origin main`

4. **Deploy to Firebase**
// turbo
   - Run: `npm run deploy`

5. **Refresh Mobile App**
   - On your phone, close the app and reopen it, or refresh the browser.
