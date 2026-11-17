# FYNDADZ Website

A responsive five-page creative agency website built with static HTML, CSS and JavaScript.

## Public pages
- `index.html` — Home
- `about.html` — About FYNDADZ
- `services.html` — Services
- `audit.html` — Digital audit and request form
- `contact.html` — Contact and enquiry form

## Visual identity
The agency theme uses the FYNDADZ purple identity (`#8A2BE2`) with dark studio styling, bold typography, graphic service panels and responsive layouts. Fonts are Nebula and Helvetica from the repository assets.

## Free AI audit
`audit.html` includes a detailed free baseline audit flow. It checks the submitted public homepage HTML, requests Google PageSpeed Insights for mobile and desktop, uses OpenAI to write evidence-led channel reviews and priorities, and emails the report through Resend. Reports can also be printed or saved as PDF from the browser. Social metrics, paid campaign results, analytics and competitor benchmarks are explicitly marked as requiring account access or a separate review; they are never fabricated.

### Required Vercel environment variables
- `OPENAI_API_KEY` — server-side OpenAI API key (never expose in browser code)
- `RESEND_API_KEY` — Resend API key for email delivery
- `AUDIT_FROM_EMAIL` — optional verified sender, e.g. `FYNDADZ Audit <audit@your-verified-domain.com>`
- `OPENAI_MODEL` — optional model override; defaults to `gpt-4.1-mini`
- `PAGESPEED_API_KEY` — optional Google PageSpeed Insights API key for higher quota

The API endpoint is `POST /api/audit`. Audit submissions are not stored in the employee-management database. Email delivery requires a verified sender domain in Resend. Never commit API keys to GitHub.

## Employee portal
The existing employee ID directory remains available at `employees.html`, with records in `employees.json` and supporting assets in `assets/`. The employee app in `app/` is unchanged.

## Hosting
The repository is connected to Vercel through GitHub. Commits to the production branch trigger deployments.
