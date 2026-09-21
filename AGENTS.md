# Shalt workflow

This repository is the single source of truth for **Шалт — Путь в горы**.

## Branches
- `main`: production only. Never use it for experiments.
- `dev`: preview/staging. Implement and verify requested changes here first.
- Promote a change to `main` only after the user approves the preview.

## Deployment
- Production Railway service: `shalt-game-v2` from `main`.
- Preview Railway service: `shalt-game-preview` from `dev`.
- Build verification: `npm ci`, `npm test`, `npm run build`.
- Runtime: `npm start`.
- Health check: `/`.

## Assets
- Store all game art, sprites, audio, and static assets in the repository.
- Artwork belongs under `public/art/`.
- Never store images in Railway environment variables or base64 strings.
- Never replace realistic game artwork with inline SVG placeholders unless the user explicitly asks for that style.
- Do not lower source-image resolution just to make deployment easier.
- Preserve the established realistic visual style unless explicitly asked otherwise.

## Change process
1. Read the relevant code and assets.
2. Make the smallest targeted change on `dev`.
3. Run tests and build checks.
4. Deploy and inspect preview.
5. Ask the user to review the preview.
6. Only after approval, promote the approved commit to `main`.
7. Verify production after deploy.

## Project isolation
- Do not modify unrelated repositories, Railway services, or projects.
- Do not touch Jargat when working on Shalt.
- Do not replace production assets with temporary placeholders.
