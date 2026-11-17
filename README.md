# FYNDADZ Website

A refreshed five-page public website for FYNDADZ, built with responsive static HTML, CSS and JavaScript.

## Public pages
- `index.html` — Home
- `about.html` — About
- `services.html` — Services
- `audit.html` — Digital audit information and request form
- `contact.html` — Contact and enquiry form

## Design
The public marketing website uses the FYNDADZ purple identity (`#8A2BE2`) with a fresh light editorial layout, responsive navigation, reusable design components, and the repository's Nebula and Helvetica fonts.

## Forms
The audit and contact forms prepare an email to `fyndadz@gmail.com` using the visitor's email application. They do not send or store submissions on the website. Connect a form backend to collect submissions directly online.

## Employee ID workspace
The existing employee directory and employee ID system are retained at `employees.html`, with its employee records in `employees.json` and supporting assets in `assets/`. The employee workspace in `app/` is unchanged.

## Hosting
The project is connected to Vercel through GitHub. Commits to the production branch trigger a new deployment.
