# Road Quest v0.5 — arcade visual upgrade

Replaces the earlier blocky 16-bit driving view with a wider, higher-resolution, retro-3D-inspired chase-camera view.

## What's changed
- 800×500 landscape canvas, scaled responsively
- Smoother, larger Renault 5 and Clio rear-view illustrations
- Curving perspective road with animated lane markings and shoulders
- More layered roadside scenery, lighting and traffic
- Collectible icons, visual speedometer and simulated speed streaks
- Existing quizzes, collectible points, car choice, collision handling and profile XP integration preserved

This is **not a fully textured 3D engine** and should not be confused with a commercial game such as Ridge Racer. It is a dependency-free canvas implementation aimed at rapidly reviewing the visual direction.

## Updating GitHub
Upload `src/ClioDrive.jsx` and `src/clio-drive.css` over the corresponding files in your existing repository, then commit. If desired, upload this changelog too. Vercel should deploy the commit.

## Testing
The code has been updated but a full Vite build could not complete in the creation environment because npm dependency installation timed out. Review the Vercel deployment logs and test mobile and desktop inputs before sharing the game. If you see an error, copy the first red build error and provide it for correction.
