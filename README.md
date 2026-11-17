# Renault Technician Academy — Concept Prototype v0.1

A **working, responsive proof of concept** for a proposed automotive technician learning application. Uses a Renault-inspired monochrome interface with full-colour user-supplied car photography. **Not an official Renault application.**

## Run locally

1. Install Node.js 20+.
2. Unzip this folder and open a terminal in `renault-technician-academy`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL displayed by Vite (normally `http://localhost:5173`).

## Create a production build

Run `npm run build`. The static output is in `dist/` and can be deployed with Vercel. On Vercel select the Vite framework, build command `npm run build`, and output directory `dist`. No environment variables are needed for this demo.

## What works

- Responsive home screen with supplied Renault image and square monochrome cards
- Home, Learn, Challenges, Rankings and Profile navigation
- Three microlearning courses with multi-step content and +40 XP first-time completion
- Three-question quiz with feedback and up to +150 XP on first completion
- Sample national, dealership and weekly rankings (your demo XP updates rankings)
- Technician display name/dealership preferences and progress saved in browser `localStorage`
- Search and category filtering of learning material
- Hints & Tips video catalogue and honest video-placeholder modal
- Reset demo data through profile

## What does NOT work yet

- No real authentication or technician accounts
- No real multi-user leaderboard or backend
- No video files or playback — the video catalogue is illustrative
- No Renault LMS, dealer or MSXI integrations
- No admin content editor, approval workflow or formal safety sign-off
- No personal or sensitive data should be entered in this demo

## Before an organisational deployment

Obtain Renault/MSXI approval for use of logos, photography, brand assets and internal technical content. Secure appropriate hosting, access controls, corporate SSO, privacy notices, consent/visibility options for rankings, accessibility review, safety review of technical learning, and server-side validation of achievements. This demonstration uses browser storage and should not be treated as production-grade identity or learner record management.

## Files

- `src/main.jsx` — the React app and sample content
- `src/style.css` — responsive square-edged monochrome visual system
- `public/renault-hero.webp` — image provided in the conversation

© Demonstration only. Renault brand/trademarks remain those of their respective owners.
