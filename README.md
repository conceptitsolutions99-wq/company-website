# True Concept - Technology Solutions Web Application

Marketing site plus client platform: Express + EJS, bilingual homepage, accounts and service
requests. Data lives in Supabase Postgres.

## Running locally

Requires Node.js and a Supabase Postgres database.

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL (and change JWT_SECRET)
npm start
```

`DATABASE_URL` is the Supabase **transaction pooler** URI (Project Settings → Database →
Connection string → URI, port 6543). Never commit `.env`.

Default admin login:

- Email: `admin@trueconcept.com`
- Password: `admin123`

Change that password before the site is public.

## Database

The schema lives in `migrations/0001_init.sql` — three tables (`users`, `services`,
`requests`) with row level security enabled. The app never creates tables at runtime; it
connects with the Postgres role, which bypasses RLS, while the public REST API is left with
no policies so users and requests stay private.

Apply schema changes by adding a migration file and running it against the project, or with
`supabase db push`.

## Static preview

```bash
npm run build:static
```

Renders `views/index.ejs` into a self-contained `index.html` (CSS and JS inlined, server-only
links removed) for the `gh-pages` branch. Regenerate it whenever the homepage template, styles
or scripts change.
