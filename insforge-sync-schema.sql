-- Arcus remote sync schema for InsForge/Postgres
-- Run this against the Arcus backend database before expecting cross-device sync.

create table if not exists public.conversations (
  id text primary key,
  user_id text not null,
  title text not null default 'New Chat',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_updated_at_idx
  on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);

-- Optional but recommended: enable row level security if your backend exposes these tables directly.
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- These policies use the standard PostgREST JWT subject claim.
-- Adjust them if your InsForge environment uses a different auth claim helper.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'conversations' and policyname = 'arcus_conversations_owner_all'
  ) then
    create policy arcus_conversations_owner_all on public.conversations
      using (user_id = current_setting('request.jwt.claim.sub', true))
      with check (user_id = current_setting('request.jwt.claim.sub', true));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'arcus_messages_owner_all'
  ) then
    create policy arcus_messages_owner_all on public.messages
      using (
        exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
            and conversations.user_id = current_setting('request.jwt.claim.sub', true)
        )
      )
      with check (
        exists (
          select 1
          from public.conversations
          where conversations.id = messages.conversation_id
            and conversations.user_id = current_setting('request.jwt.claim.sub', true)
        )
      );
  end if;
end $$;
