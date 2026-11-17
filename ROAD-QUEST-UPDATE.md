# Renault Technician Academy — Road Quest update (v0.4)

The original top-down 8-bit Clio Drive has been replaced with a playable, 16-bit-inspired, rear-view arcade game titled **Renault Road Quest**.

## What's new

- Select a stylised Renault Clio (blue) or Renault 5 (yellow) before starting.
- Three-lane perspective road with rear-facing pixel cars, moving traffic and scenery.
- Dodge passing traffic — the run ends after three collisions.
- Collect spanners (+15 XP), diagnostic tablets (+25 XP) and spare parts (+20 XP).
- Answer three brief learning-checkpoint questions (+60 XP per correct answer).
- Cross the finish line (+120 XP).
- Works with keyboard arrow keys / A-D and on-screen left/right buttons.
- The Academy's demo profile awards only the **improvement over your previous best completed run**, preventing repeated XP farming.
- Forced Ignition Procedure video and all other Academy features are preserved.

## Update the existing GitHub/Vercel site

1. Extract this ZIP.
2. In the existing private GitHub repository, update `src/ClioDrive.jsx`, `src/clio-drive.css`, and `src/main.jsx`. The rest of the app is unchanged.
3. Commit the changes to `main`.
4. Vercel will automatically rebuild the app if connected to that branch.

Alternatively, upload all project files into the root of the existing repository, carefully replacing matching files. Avoid nested folders and duplicate filenames.

For your own local build: `npm install` then `npm run build` (output: `dist`).

**Note:** The included game uses illustrative retro pixel graphics, not Renault-licensed vehicle sprites. Learning content is illustrative and should be reviewed before internal use. This is a demo with browser-local progress, not a networked leaderboard.
