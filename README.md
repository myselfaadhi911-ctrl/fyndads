# FYND ADZ Website

Five-page responsive website for FYND ADZ, built with static HTML, CSS and JavaScript for GitHub Pages.

## Pages
- `index.html` — Home
- `about.html` — About FYND ADZ
- `services.html` — Services
- `contact.html` — Contact and enquiry form
- `employees.html` — Employee ID directory and digital profile pages

## Employee IDs and QR links
Employee records are stored in `employees.json`. Individual profile URLs use `employees.html?id=FYND###`. QR codes generated on the Employee ID page point to those URLs. Older QR codes that used `/?id=FYND###` are redirected to the Employee ID page to preserve printed cards.

Employee profiles include QR download, call/WhatsApp/email links where provided, and vCard contact export. Employee image assets are kept in `assets/`, including pre-split photo chunks in `assets/photos/`.

## Admin access
The Admin edit link opens `employees.json` in GitHub. Only a GitHub user signed in with repository write access can save employee changes. The public website does not expose an employee-add form to visitors.

## Assets
- `assets/brand/` — FYND ADZ logo assets
- `assets/fonts/` — Nebula and custom Helvetica font files
- `assets/photos/` — employee photo data chunks
- `assets/*.webp` — employee portraits
- `css/style.css` — shared responsive styling and motion
- `js/app.js` — navigation, animation, employee rendering, QR generation and contact interactions

The QR code generator is loaded from cdnjs, and image chunks are fetched from the same GitHub Pages site. An internet connection is needed for those functions.


## Employee management workspace
The secure, installable cross-platform employee app lives in [`app/`](./app/). It uses Supabase Auth, Postgres with row-level security, GPS-at-punch attendance, task assignment and digital employee QR cards. See [`app/README.md`](./app/README.md) for setup and admin onboarding.


## Website background
The public marketing site uses `assets/brand/fyndadz-gradient-background.svg`, a smooth vector backdrop that scales cleanly across screen sizes. The public pages use the vector artwork in place of the old grain/canvas texture.


The public-site background is animated: the vector ribbons and separate violet light fields move on independent, slow non-linear CSS keyframe paths. The grain layer and old canvas renderer are disabled, and reduced-motion settings are respected.


Header polish: the unused pre-header curtain image has been removed from public pages; the skip-to-content link is visually hidden until keyboard focus; the desktop sticky header now compacts on scroll and tucks away while scrolling down, returning on scroll-up.


### Website background motion
The public site uses a minimal CSS-only flowing purple background. Two slow transform-based gradient layers provide the motion; there is no background image download, canvas loop, blur filter or grain texture. Motion pauses when the tab is hidden and is disabled for reduced-motion preferences.
