# FYNDADS Workspace

Installable cross-platform PWA for employee login, attendance, tasks, team directory, QR employee IDs and reports.

## Backend
- Supabase project: `wxbybbpxkjfeklhqxkul` (Mumbai)
- Frontend uses the public publishable key only.
- Row-level security remains the authority for database access.
- `fyndads-auth-admin` Edge Function verifies signed-in users, allows the verified administrator email to claim the initial admin role, and sends employee invitations only for an existing active employee record with a matching saved email.
- Auth user creation is linked to employee rows by the database trigger migration.

## Deploy
The static app is served from this folder. Publish the repository with GitHub Pages using the repository root as the site root; the app will be available at `/app/`. Add the app URL to Supabase Auth > URL Configuration > Redirect URLs. For production, configure a custom domain and HTTPS.

## First admin setup
1. Open `/app/` and request a magic sign-in link for `adhilshamohammed911@gmail.com`.
2. Open the email link in the same browser/device.
3. Use **Activate admin access** on the sign-in screen if shown, then refresh the session.
4. Admin can save each employee's work email and send the invite from Team & ID cards.

The admin role is stored in trusted `app_metadata`, never user-editable `user_metadata`. No service-role key is shipped to the browser.
