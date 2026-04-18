# TODO

Items to action before or after production deployment.

## Production Setup
- [ ] Set `ADMIN_API_KEY` environment variable on Render — go to service → **Environment**, add a strong random value (e.g. `openssl rand -hex 32`). Without it the app falls back to `dev-admin-key`.
