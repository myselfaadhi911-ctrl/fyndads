# FYNDADS Employee Digital ID

Mobile-friendly public employee directory with individual profile pages and downloadable QR codes.

## Included
- Searchable employee directory and department filter
- Individual profile URLs using `?id=FYND-001`
- QR code preview and PNG download for each employee
- Add, edit, delete and import/export employee records
- Call, WhatsApp, email, social links and downloadable vCard contact
- Responsive FYNDADS purple theme

## Publish with free GitHub Pages
1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch **main** and folder **/(root)**, then click **Save**.
4. Wait for GitHub Pages to finish publishing. The expected URL is:
   https://myselfaadhi911-ctrl.github.io/fyndads/

## Add actual employees
The current `employees.json` contains three demo profiles. Replace their values before sharing the site.
- Open the website and choose **Manage IDs → Add employee** to create records in the current browser.
- Use **Export employees.json** to download the updated data.
- Replace the repository's `employees.json` with that exported file and commit the change to publish updates to everyone.

## QR codes
After Pages is live:
1. Open the website.
2. Choose **Manage IDs** or locate an employee card.
3. Click **QR code**.
4. Click **Download QR PNG** and print it on that employee's ID card.

QR codes contain only the stable employee profile URL, so profile details can be changed later without changing the printed code, as long as the employee ID and site URL remain the same.

## Important limitation and privacy
GitHub Pages is static hosting. This starter has no shared database and no secure administrator login. Changes made in Manage IDs initially remain in that browser only; export `employees.json` and commit it to publish shared updates. The repository is public, so treat all employee profiles and contact details as public information. Obtain consent before publishing details or photos. Never add passwords, personal identification numbers, financial information, or other sensitive data.

QR code generation uses the QRCode.js library via a public CDN, so QR generation requires an internet connection.
