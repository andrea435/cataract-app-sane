-- Lock-screen push alerts for referrals.
--
-- Each phone that allows notifications registers its Firebase Cloud Messaging token here
-- after sign-in. The `notify-referral` Edge Function (service role) reads the tokens of
-- the people to alert and sends the push; the app never reads other people's tokens.

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- People manage only their own phone's token (a phone that changes hands re-registers
-- under the new account).
create policy "own push tokens" on public.push_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
