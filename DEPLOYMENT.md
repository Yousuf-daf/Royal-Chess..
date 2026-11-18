# Royal Chess — Deployment & Custom Domain Guide

This project is pre-configured for production deployment on **Vercel** and **Google Cloud Run**.

> **Important:** No domain is purchased or connected yet. Deploy the app first to obtain a working public URL (`*.vercel.app` or `*.run.app`), test every feature there, and then connect your custom domain (e.g., `www.mybrand.com`).

---

## Option 1: Deploy to Vercel (Fastest for Beginners)

1. Push this project to a **GitHub**, **GitLab**, or **Bitbucket** repository.
2. Sign in at [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import your repository. Vercel reads `vercel.json` automatically:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**.
5. Once complete, Vercel gives you a live HTTPS URL (for example, `https://royal-chess.vercel.app`).

---

## Option 2: Deploy to Google Cloud Run

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and authenticate:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Enable required APIs (first time only):
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
   ```
3. Deploy from the project root directory (uses the included `Dockerfile` and `server.ts`):
   ```bash
   gcloud run deploy royal-chess \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000
   ```
4. Cloud Run builds the production image, starts the Express server on port `3000`, and outputs your public HTTPS URL (for example, `https://royal-chess-xxxxx-uc.a.run.app`).

---

## Connecting Your Own Custom Domain (e.g., `www.mybrand.com`)

1. **Purchase a domain** from a registrar (Namecheap, Cloudflare Registrar, Porkbun, Squarespace Domains, or Google Cloud Domains).
2. **Register the domain with your host:**
   - **Vercel:** Project → **Settings → Domains** → add `www.mybrand.com` and `mybrand.com`.
   - **Cloud Run:** Google Cloud Console → **Cloud Run → royal-chess → Manage Custom Domains → Add Mapping** → map `www.mybrand.com` (and optionally `mybrand.com`).
3. **Update DNS records at your registrar** using the exact values shown in your Vercel or Cloud Run dashboard:
   - **`www` subdomain (`www.mybrand.com`):** Add a `CNAME` record (`Host/Name: www`, `Target: cname.vercel-dns.com` for Vercel or `ghs.googlehosted.com` for Cloud Run).
   - **Apex/root domain (`mybrand.com`):** Add the `A` / `AAAA` IP records shown by your host so visitors typing `mybrand.com` without `www` are redirected automatically.
4. **Verify HTTPS / SSL:**
   - Both Vercel and Google Cloud Run automatically issue and renew free TLS/SSL certificates once DNS propagates (usually 5–30 minutes). Do not disable HTTPS; wait until the certificate shows **Active / Valid**.

---

## Publishing Future Updates Without Breaking the Live Site

- **Vercel:** Do new work on a branch or pull request—Vercel creates an isolated **Preview URL** for every push. Merge into `main` only after testing. Deployments switch atomically after a successful build, with one-click rollback under **Deployments**.
- **Google Cloud Run:** Every deploy creates a new immutable **Revision** and checks `/healthz` before serving traffic. You can test a preview revision first:
  ```bash
  gcloud run deploy royal-chess --source . --region us-central1 --no-traffic --tag preview
  ```
  Verify the preview URL, then route 100% traffic to the new revision in Cloud Run → **Revisions → Manage Traffic** (or redeploy normally).
