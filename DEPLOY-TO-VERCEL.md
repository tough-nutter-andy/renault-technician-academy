# Deploy the Technician Academy demo on Vercel

This is an **unofficial public-facing prototype**. It has no authentication; demo rankings and browser-local progress are not shared between users. Do not enter real staff information or confidential Renault technical content.

## Option A: GitHub -> Vercel (recommended, automatic future updates)

1. Unzip the project. Open the **renault-technician-academy** folder (the one containing `package.json`).
2. In GitHub choose **New repository**, name it `renault-technician-academy`, and set it **Private**. Do not add a README during creation.
3. In the new GitHub repository choose **Add file -> Upload files**. Upload the **contents** of the `renault-technician-academy` folder, retaining `src/` and `public/` subfolders. Alternatively, use Git from the project directory:

   ```bash
   git init
   git add .
   git commit -m "Initial technician academy demo"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/renault-technician-academy.git
   git push -u origin main
   ```

4. Go to https://vercel.com/new, sign in, connect GitHub, and **Import** your private repository.
5. Confirm: **Framework preset** `Vite`, **Root directory** `./`, **Build command** `npm run build`, **Output directory** `dist`. No environment variables needed.
6. Click **Deploy**. Vercel provides a site URL when the build finishes. Keep access restricted where possible until branding/security review.
7. To update: commit and push changes to the GitHub repository. Vercel then automatically rebuilds.

**Important:** The GitHub repository is private, but that does **not** automatically make the deployed website private. Configure Vercel deployment protection if your plan supports it, or keep non-approved content out of the site.

## Option B: Vercel CLI (no GitHub needed for first deployment)

From the project directory, with Node installed:

```bash
npm install
npm run build
npx vercel
npx vercel --prod
```

Log in and follow the CLI prompts. Choose the current folder as project directory and Vite settings. Future updates require running `npx vercel --prod` again, unless you connect a Git repository.

## Confirm deployment works

- Home hero shows the supplied full-colour Renault vehicle image.
- All five navigation tabs open.
- Complete a microlearning lesson; XP increases.
- Finish the diagnostic quiz; rankings update on **that browser**.
- Reload the page; browser-local progress remains.

This prototype is **not ready to give real technicians accounts**: add approved SSO/login, a secure server-side database, role-based permissions and an authorised learning-content review process before a network rollout.
