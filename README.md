# Our First Anniversary

A private, responsive anniversary site built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Express.

## Run locally

1. Install Node.js 20 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env`. Choose your own four-digit `ANNIVERSARY_PIN` and a long, random `SESSION_SECRET` (at least 32 characters).
4. Start the development server with `npm run dev`.
5. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

The development PIN defaults to `0813` if `ANNIVERSARY_PIN` is unset. The countdown page's **Test Website** preview is shown only in development; it skips the countdown but still requires the PIN. Never use the development defaults in a deployed site.

## Personalize the story

Edit the private content in `server/content.ts`. It contains the timeline, gallery captions and categories, reasons, letter, and demo image URLs. Replace the demo images with your own image URLs or upload photos from the gallery and puzzle pages. Uploaded files are stored under `server/private/uploads`, are excluded from Git, and are served only through the authenticated media route. Keep personal images and their backups private.

The PIN and all story data are read by the server and are not bundled into the public frontend. The server uses a signed, HTTP-only, same-site session cookie, compares PINs in constant time, limits PIN attempts, and rejects production unlock attempts before midnight at the start of August 13, 2027 in Asia/Manila (UTC+08:00). The browser countdown is only a display; the production server enforces the date independently.

## Build and deploy

- `npm run build` type-checks the client and server and creates the Vite production build in `dist`.
- Set `NODE_ENV=production`, `SESSION_SECRET`, `ANNIVERSARY_PIN`, and optionally `PORT` in your hosting provider's secret/environment settings.
- Run `npm start` on a persistent Node.js host. The Express server serves the production frontend and private API from the same origin. Use HTTPS in production so the session cookie's `Secure` flag is honored.
- Persist and back up `server/private/uploads` on a private durable volume if uploaded photos should survive redeploys. Do not publish this directory as a static asset folder.

The content in `server/content.ts` is intentionally edited by the site owner in the project source; it is not an unauthenticated public content-management interface.
