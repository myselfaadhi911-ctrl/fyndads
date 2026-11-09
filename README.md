# FYND ADZ – Employee Digital ID (v2)

Animated employee directory with individual digital ID profiles, flip-card QR codes, downloadable QR PNGs and vCard contacts. Built with plain HTML, CSS and JavaScript for GitHub Pages.

## Deployment

The live site is hosted from the `main` branch using GitHub Pages. The public URL and existing `?id=FYND001` through `?id=FYND005` profile links are preserved, so previously printed QR codes continue to work.

## Employee administration

The **Admin** link opens `employees.json` in GitHub. Saving changes requires being signed in to an account with repository write permission. This keeps employee edits restricted to authorized GitHub collaborators; visitors cannot add employees from the public website.

To add a person, add a record to `employees.json`, give them a unique `FYND###` ID, add their photo under `assets/people/` (or use `photoParts` for the pre-split image data already in `assets/photos/`), and set `status` to `Active`. Use `Inactive` to hide a profile without deleting its QR target.

## Project files

- `index.html` – page structure and external QR library
- `css/style.css` – responsive visual design, motion and layouts
- `js/app.js` – directory, profiles, QR generation, vCard export, interactions and image loading
- `employees.json` – employee details and photo references
- `assets/` – brand artwork, fonts and employee photos

The QR code library is loaded from cdnjs, so generating QR codes requires an internet connection.
