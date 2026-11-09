# FYNDADS Employee Digital ID

Public, mobile-friendly employee directory with individual profile pages and QR code downloads.

## Public website
https://myselfaadhi911-ctrl.github.io/fyndads/

## Public features
- Searchable employee directory and department filter
- Individual profile URLs: `?id=FYND001`
- QR code preview and PNG download for each employee
- Call, WhatsApp, email, social links and downloadable vCard contact
- Responsive FYNDADS purple theme

## Admin access (restricted through GitHub)
The public website does not provide Add, Edit or Delete employee forms. The **Admin Login** link opens the repository's `employees.json` editor on GitHub.

Only GitHub accounts with write permission to this repository can commit employee changes to the live site. Keep repository write access limited to the FYNDADS administrator. Do not grant collaborator write access unless you intend to let that person update employee records.

### Add or update an employee
1. Sign in to GitHub using the FYNDADS administrator account.
2. Open the website's **Admin Login** link, or open:
   https://github.com/myselfaadhi911-ctrl/fyndads/edit/main/employees.json
3. Edit the JSON employee array. Keep every `id` unique.
4. Click **Commit changes** to publish the updated directory.
5. For a profile photo, upload the image to the repository's `assets/` folder, then set its relative path in the employee's `photo` field (for example, `assets/jahana-shirin.jpg`).

Example record:
```json
{
  "id": "FYND004",
  "name": "Employee Name",
  "role": "Designation",
  "department": "Marketing",
  "phone": "",
  "email": "",
  "website": "",
  "instagram": "",
  "linkedin": "",
  "photo": "",
  "status": "Active",
  "bio": ""
}
```

### Why GitHub is used for admin permissions
GitHub Pages is static hosting and cannot securely protect an administrator password or write changes to a shared database on its own. The Admin Login link uses GitHub's own sign-in and repository write permissions instead of a password embedded in public website code. This means only the repository owner (and any collaborators deliberately granted write access) can publish employee changes. Do not add a client-side password to the website; visitors can inspect static website code.

## QR codes
1. Open the public site.
2. Find the employee card and click **QR code**.
3. Click **Download QR PNG**.
4. Scan-test the image before printing it on the employee ID card.

QR codes contain the employee's stable profile URL. Keep the employee ID and website URL unchanged to keep already printed QR codes working after profile details are updated.

## Privacy
This repository and website are public. Only publish employee details and photos with the employee's permission. Do not add passwords, personal identification numbers, financial information or other sensitive data.
QR code generation uses the QRCode.js library via a public CDN and needs an internet connection.
