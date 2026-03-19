<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/daacff15-51f0-4511-a1a9-17dee02bb4b8

## Run Locally

1. **Prerequisites**: Node.js and Java (JRE).
2. **Install dependencies**:
   ```bash
   npm install
   cd execution-engine && npm install && cd ..
   ```
3. **Configure Environment**: Copy `.env.example` to `.env` and add your `VITE_GEMINI_API_KEY`.
4. **Run the app**:
   ```bash
   npm run dev:full
   ```

## Deployment

### 1. Execution Engine (Koyeb)
- Create a new **Web Service** on [Koyeb](https://app.koyeb.com/).
- Connect your GitHub repository.
- Koyeb will automatically detect the `Dockerfile` in the root.
- Set the `PORT` environment variable to `8080` (optional, default).
- Once deployed, copy the public URL (e.g., `https://my-app.koyeb.app`).

### 2. Frontend (Netlify)
- Create a new site on **Netlify** from the same GitHub repository.
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_GEMINI_API_KEY`: Your Gemini API key.
  - `VITE_API_BASE_URL`: The URL of your Koyeb service.
