# Our First Anniversary

A private, responsive anniversary site built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Express.

## Run locally

1. Install Node.js 20 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env`. Choose your own four-digit `ANNIVERSARY_PIN` and a long, random `SESSION_SECRET` (at least 32 characters).
4. Start the development server with `npm run dev`.
5. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

The development PIN defaults to `0813` if `ANNIVERSARY_PIN` is unset. Never use the development defaults in a deployed site.

## Personalize the story

Edit the private content in `server/content.ts`. It contains the timeline, gallery captions and categories, reasons, letter, and demo image URLs. Replace the demo images with your own image URLs or upload photos from the gallery and puzzle pages. Uploaded files are stored under `server/private/uploads`, are excluded from Git, and are served only through the authenticated media route. Keep personal images and their backups private.

The PIN and all story data are read by the server and are not bundled into the public frontend. The server uses a signed, HTTP-only, same-site session cookie, compares PINs in constant time, limits PIN attempts, and rejects production unlock attempts before midnight at the start of August 13, 2027 in Asia/Manila (UTC+08:00). The browser countdown is only a display; the production server enforces the date independently.

## Build and deploy

- `npm run build` type-checks the client and server and creates the Vite production build in `dist`.
- Set `NODE_ENV=production`, `SESSION_SECRET`, `ANNIVERSARY_PIN`, and optionally `PORT` in your hosting provider's secret/environment settings.
- Run `npm start` on a persistent Node.js host. The Express server serves the production frontend and private API from the same origin. Use HTTPS in production so the session cookie's `Secure` flag is honored.
- Persist and back up `server/private/uploads` on a private durable volume if uploaded photos should survive redeploys. Do not publish this directory as a static asset folder.

The content in `server/content.ts` is intentionally edited by the site owner in the project source; it is not an unauthenticated public content-management interface.

### Deploy with GitHub and Vercel

The Vercel configuration builds the frontend as static assets and routes `/api/*` requests to the Express serverless function in `api/[...path].ts`. To deploy:

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New Project**, import that GitHub repository, and keep the detected project root.
3. Add `SESSION_SECRET` and `ANNIVERSARY_PIN` as Vercel environment variables for **Production** and **Preview**. Generate a unique random `SESSION_SECRET` of at least 32 characters; do not use the example value. Do not add a `VITE_` prefix to either secret.
4. Deploy. Vercel will build with `npm run build`, and subsequent pushes to the connected repository will trigger deployments.

Vercel Functions use temporary `/tmp` storage for uploaded photos. Those uploads are not durable and may not be available across function instances or deployments. Use persistent object storage before relying on gallery uploads in production.
