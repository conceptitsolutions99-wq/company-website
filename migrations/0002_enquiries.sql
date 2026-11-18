-- Enquiries submitted through the public site.
--
-- The endpoint writes the row first and only then sends the email, so a mail
-- failure (or a missing SMTP password) never loses a lead: anything unsent has
-- email_sent = false and can be picked up from the table.

create table if not exists enquiries (
    id          bigserial primary key,
    kind        text        not null default 'brief',   -- 'brief' | 'service'
    name        text        not null,
    email       text        not null,
    phone       text,
    service     text,
    budget      text,
    timing      text,
    message     text,
    ip          text,
    user_agent  text,
    email_sent  boolean     not null default false,
    created_at  timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on enquiries (created_at desc);
create index if not exists enquiries_unsent_idx on enquiries (created_at desc) where email_sent = false;

-- Private record: reachable with the service role, invisible to the public API.
alter table enquiries enable row level security;
