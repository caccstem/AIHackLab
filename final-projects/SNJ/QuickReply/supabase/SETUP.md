# Enable hosted accounts and syncing

The app is wired for Supabase, but it cannot connect until a Supabase project and OAuth/email providers are configured. The project URL and public anon/publishable key belong in `web/supabase-config.js`; this is safe to expose in a browser. Never use a `service_role` key in this app or extension.

## 1. Create the database

1. Create a Supabase project at <https://supabase.com/dashboard> and save its database password somewhere private.
2. In **SQL Editor**, run [`schema.sql`](schema.sql). Row Level Security limits every user to their own saved replies.
3. In **Project Settings → API**, copy the Project URL and public anon/publishable key into `web/supabase-config.js`.

## 2. Turn on email confirmation

1. In **Authentication → Providers → Email**, keep email/password enabled and turn on **Confirm email**.
2. In **Authentication → URL Configuration**, add your eventual hosted website address to **Site URL** and **Redirect URLs**. While developing, add `http://127.0.0.1:8766/**`.
3. Supabase's built-in email sender is intended for development and has recipient/rate limits. To deliver confirmation messages to any customer's Gmail reliably, configure a custom SMTP provider under **Authentication → SMTP Settings**, then verify its sender domain and DNS records with that provider. The app does not send Gmail messages itself.

## 3. Enable Google sign-in

1. Create a Google Cloud project, configure the OAuth consent screen, and create a **Web application** OAuth client.
2. In Supabase **Authentication → Providers → Google**, enable Google and enter the OAuth client ID and client secret.
3. Copy the Supabase callback URL shown on that provider screen into the Google OAuth client's **Authorized redirect URIs**.
4. Add the hosted site address to Supabase's allowed redirect URLs. The dashboard's **Continue with Google** button uses Supabase OAuth.

Google and SMTP secrets stay in their provider dashboards. Do not commit them to this repository or paste them into frontend files.

## 4. Host the website

Deploy the `web/` folder to a static host that serves `index.html`, `style.css`, `app.js`, and `supabase-config.js` from the same origin. Add that HTTPS address to Supabase's URL allowlist and update the email redirect. The repository's Python server remains a local development server; the cloud path uses Supabase directly.

Copy the same public project URL and anon/publishable key into `extension/config.js`, then reload the unpacked extension in `chrome://extensions`. It can register/sign in by email and read the same cloud reply library. Google OAuth is currently available on the website; Google sign-in inside the extension needs a separate Chrome extension OAuth flow and is not enabled yet.
