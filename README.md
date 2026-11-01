# stockaria.gr (prototype)

Clickable, mobile-first prototype of a marketplace where shops sell their unsold new clothes and shoes. Everything is stored in the browser (`localStorage`): no backend, no emails, no real payments.

Design: [docs/superpowers/specs/2026-11-01-stockaria-design.md](docs/superpowers/specs/2026-11-01-stockaria-design.md)
Plan: [docs/superpowers/plans/2026-11-01-stockaria-prototype.md](docs/superpowers/plans/2026-11-01-stockaria-prototype.md)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # business logic tests
npm run build    # static export to ./out
```

## Demo accounts (email link login is simulated)

- Store: `eleni@example.gr`, `nikos@example.gr`, `kostas@example.gr`
- Admin: `/admin/login/` with `admin@stockaria.gr`
- Customer: any email, or buy as a guest.

The "Επαναφορά" link in the yellow banner restores the demo data.

## Structure

- `src/lib/logic/`: pure, tested business rules (orders, ledger, cart, payouts, stats).
- `src/lib/api.ts`: the only data access layer the UI uses. Replace it with Supabase in phase 2.
- `src/app/`: pages. Detail pages use query strings (`/product/?id=...`) so the app can be exported statically.

## Publish to GitHub Pages

`.github/workflows/pages.yml` builds the static export on every push to `main`. After pushing, enable it in the repository: Settings, Pages, Source: GitHub Actions. The site is then at `https://<user>.github.io/<repo>/`. On a free GitHub account Pages needs a public repository.
