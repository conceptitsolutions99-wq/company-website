/**
 * Data layer — Supabase Postgres.
 *
 * The queries were written against SQLite, which accepts `?` placeholders, so
 * this module rewrites them to Postgres `$1, $2, …` and nothing in the pages
 * has to know which database is behind them.
 *
 * The connection pool is created on first use rather than at import time, so a
 * missing or misconfigured DATABASE_URL cannot take the whole site down: the
 * marketing pages still render and only the catalogue route fails.
 *
 * Requires DATABASE_URL — the Supabase pooler connection string:
 *   postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:6543/postgres
 */
require('dotenv').config();

const { Pool } = require('pg');

let pool = null;
let warned = false;

function getPool() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        if (!warned) {
            warned = true;
            console.error('[database] DATABASE_URL is not set — routes that need data will fail.');
        }
        throw new Error(
            'DATABASE_URL is not set. Add the Supabase connection string to .env (or the ' +
            'Vercel environment variables).'
        );
    }

    if (!pool) {
        pool = new Pool({
            connectionString,
            // Supabase requires TLS; a local Postgres in development usually has none.
            ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
            // Serverless functions are short-lived; a small pool avoids connection storms.
            max: Number(process.env.PG_POOL_MAX) || 3,
            idleTimeoutMillis: 10000
        });
    }

    return pool;
}

const toPostgres = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => '$' + (++index));
};

const dbQuery = async (sql, params = []) => {
    const result = await getPool().query(toPostgres(sql), params);
    return result.rows;
};

const dbQueryOne = async (sql, params = []) => {
    const result = await getPool().query(toPostgres(sql), params);
    return result.rows[0] || null;
};

module.exports = { dbQuery, dbQueryOne };
