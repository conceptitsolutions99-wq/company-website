# True Concept - Technology Solutions Web Application

Marketing site: Express + EJS, bilingual homepage and a service catalogue. There are no
accounts — every enquiry and service request from the site is emailed to
`conceptitsolutions99@gmail.com`. Data lives in Supabase Postgres.

## Running locally

Requires Node.js and a Supabase Postgres database.

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL and the SMTP values
npm start
```

`DATABASE_URL` is the Supabase **transaction pooler** URI (Project Settings → Database →
Connection string → URI, port 6543). Never commit `.env`.

Without `DATABASE_URL` the marketing pages still render; only the service catalogue needs it.

## Enquiry email

`/api/enquiry` renders the forms' contents into an email — nothing is stored on the server.
It sends through SMTP using `SMTP_USER` / `SMTP_PASS` (a Google **App Password**, not the
account password) to `CONTACT_EMAIL`, which defaults to the company inbox. If the credentials
are missing the endpoint answers `503` and the form tells the visitor where to write instead.

## Database

The schema lives in `migrations/0001_init.sql` — tables for the service catalogue (and the
`users` / `requests` tables left over from the removed login). The app never creates tables at
runtime; it connects with the Postgres role, which bypasses RLS.

Apply schema changes by adding a migration file and running it against the project, or with
`supabase db push`.

## Static preview

```bash
npm run build:static
```

Renders `views/index.ejs` into `index.html` (CSS, JS and the work screenshots inlined) for the
`gh-pages` branch. Regenerate it whenever the homepage template, styles, scripts or work
screenshots change.

## Work screenshots

`public/images/work/*.jpg` are real captures of the live projects at 1440×900. Re-capture one
by pointing a headless browser at the live URL; two projects (Al Ahli Al Masry, OmniSales) are
not publicly reachable, so those cards keep their generated artwork.
