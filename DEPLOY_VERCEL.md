Deploying to Vercel

1. Sign in to Vercel and import this Git repository.
2. In Project Settings > General > Root Directory: leave blank if using vercel.json, or set to `.`
3. In Environment Variables (Settings): add
   - MONGODB_URI = your MongoDB connection string
   - JWT_SECRET = a long random secret
4. Vercel will run: `npm --prefix web ci` then `npm --prefix web run build` (configured in vercel.json).
5. If images (sharp) cause issues locally, deploy on Vercel (Linux) where binaries are built automatically.
