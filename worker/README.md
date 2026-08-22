# Day Clock OAuth Worker

This Cloudflare Worker provides a full-page Google OAuth redirect for iPad browsers. Deploy it with Wrangler, then add `GOOGLE_CLIENT_SECRET` as a Worker secret. Add the deployed `/oauth/callback` URL to the Google OAuth web client’s Authorized redirect URIs. Set `APP_URL` to the published Day Clock URL.

The free Cloudflare Workers plan is sufficient for this small callback service.
