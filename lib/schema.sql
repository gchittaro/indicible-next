-- ============================================================
-- INDICIBLE — Supabase Schema
-- ============================================================

create extension if not exists "pgcrypto";

create table public.letters (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  recipient_name text,
  recipient_type text        not null,
  tone           text        not null,
  style          text        not null,
  moment         text        not null,
  intention      text        not null,
  answers        jsonb       not null default '{}',
  content        text        not null default '',
  show_mention   boolean     not null default true,
  token          text        not null unique default encode(gen_random_bytes(24), 'base64url'),
  status         text        not null default 'draft',
  ai_edits_count integer     not null default 0,
  created_at     timestamptz not null default now()
);

create table public.reactions (
  id         uuid        primary key default gen_random_uuid(),
  letter_id  uuid        not null references public.letters(id) on delete cascade,
  type       text        not null,
  message    text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id                uuid        primary key default gen_random_uuid(),
  letter_id         uuid        not null references public.letters(id) on delete cascade,
  channel           text        not null,
  recipient_contact text        not null,
  sent_at           timestamptz,
  read_at           timestamptz
);

create index on public.letters(user_id);
create index on public.letters(token);
create index on public.reactions(letter_id);
create index on public.notifications(letter_id);

alter table public.letters       enable row level security;
alter table public.reactions     enable row level security;
alter table public.notifications enable row level security;

create policy "letters: owner full access"
  on public.letters for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "letters: public read by token"
  on public.letters for select
  using (true);

create policy "reactions: insert by anyone"
  on public.reactions for insert
  with check (true);

create policy "reactions: owner reads"
  on public.reactions for select
  using (
    exists (
      select 1 from public.letters
      where letters.id = reactions.letter_id
        and letters.user_id = auth.uid()
    )
  );

create policy "notifications: owner reads"
  on public.notifications for select
  using (
    exists (
      select 1 from public.letters
      where letters.id = notifications.letter_id
        and letters.user_id = auth.uid()
    )
  );
