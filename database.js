/**
 * Data layer — Supabase Postgres.
 *
 * The app was written against SQLite, which accepts `?` placeholders and
 * reports the inserted row id on the write handle. So that every query in
 * server.js keeps working unchanged, this module adapts those two details:
 *
 *   • `?` placeholders are rewritten to Postgres `$1, $2, …`
 *   • `RETURNING id` is appended to INSERTs, so dbRun can resolve `{ id }`
 *
 * The connection pool is created on first use rather than at import time, so a
 * missing or misconfigured DATABASE_URL cannot take the whole site down: the
 * marketing pages still render and only data-backed routes fail.
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

function toPostgres(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => '$' + (++index));
}

function prepare(sql) {
    let text = toPostgres(sql);
    if (/^\s*insert\s/i.test(text) && !/returning/i.test(text)) {
        text += ' RETURNING id';
    }
    return text;
}

const dbQuery = async (sql, params = []) => {
    const result = await getPool().query(prepare(sql), params);
    return result.rows;
};

const dbQueryOne = async (sql, params = []) => {
    const result = await getPool().query(prepare(sql), params);
    return result.rows[0] || null;
};

const dbRun = async (sql, params = []) => {
    const result = await getPool().query(prepare(sql), params);
    return {
        id: result.rows[0] ? result.rows[0].id : null,
        changes: result.rowCount
    };
};

module.exports = {
    getPool,
    dbQuery,
    dbQueryOne,
    dbRun
};
