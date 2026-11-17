-- Tugtog: Banda (teams)
-- Isang banda ay may mga miyembro, at bawat miyembro ay may instrumento.
-- Makikita ng mga miyembro ang mga setlist na ibinahagi sa banda, pati ang mga kanta sa loob nito.

-- 1. Mga table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invite_code uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  instrument text not null default 'gitara'
    check (instrument in ('vocals', 'gitara', 'piano', 'bass', 'drums')),
  role text not null default 'member' check (role in ('leader', 'member')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.setlists
  add column if not exists team_id uuid references public.teams (id) on delete set null;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- 2. Mga helper. Security definer para hindi umikot ang RLS (songs → setlist_items → songs).
create or replace function public.is_team_member(p_team uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team and user_id = auth.uid()
  );
$$;

create or replace function public.is_team_leader(p_team uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team and user_id = auth.uid() and role = 'leader'
  );
$$;

create or replace function public.can_view_setlist(p_setlist uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.setlists s
    where s.id = p_setlist
      and (s.owner_id = auth.uid() or (s.team_id is not null and public.is_team_member(s.team_id)))
  );
$$;

create or replace function public.song_in_team_setlist(p_song uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.setlist_items i
    join public.setlists s on s.id = i.setlist_id
    where i.song_id = p_song
      and s.team_id is not null
      and public.is_team_member(s.team_id)
  );
$$;

-- 3. Mga patakaran (RLS)
drop policy if exists "Nakikita ng miyembro ang banda" on public.teams;
create policy "Nakikita ng miyembro ang banda" on public.teams
  for select to authenticated using (public.is_team_member(id));

drop policy if exists "Mababago ng may-ari ang banda" on public.teams;
create policy "Mababago ng may-ari ang banda" on public.teams
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Mabubura ng may-ari ang banda" on public.teams;
create policy "Mabubura ng may-ari ang banda" on public.teams
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "Nakikita ang kapwa miyembro" on public.team_members;
create policy "Nakikita ang kapwa miyembro" on public.team_members
  for select to authenticated using (public.is_team_member(team_id));

drop policy if exists "Mababago ang sariling instrumento" on public.team_members;
create policy "Mababago ang sariling instrumento" on public.team_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Puwedeng umalis ang miyembro, at puwedeng magtanggal ang leader; hindi puwedeng umalis ang may-ari
drop policy if exists "Umalis o magtanggal ng miyembro" on public.team_members;
create policy "Umalis o magtanggal ng miyembro" on public.team_members
  for delete to authenticated using (
    (user_id = auth.uid() or public.is_team_leader(team_id))
    and user_id <> (select t.owner_id from public.teams t where t.id = team_id)
  );

drop policy if exists "Setlist ng banda" on public.setlists;
create policy "Setlist ng banda" on public.setlists
  for select to authenticated using (team_id is not null and public.is_team_member(team_id));

-- Maibabahagi lang ang setlist sa bandang kasapi ka
drop policy if exists "Sa sariling banda lang ibabahagi" on public.setlists;
create policy "Sa sariling banda lang ibabahagi" on public.setlists
  as restrictive for insert to authenticated
  with check (team_id is null or public.is_team_member(team_id));

drop policy if exists "Sa sariling banda lang ibabahagi (update)" on public.setlists;
create policy "Sa sariling banda lang ibabahagi (update)" on public.setlists
  as restrictive for update to authenticated
  using (true) with check (team_id is null or public.is_team_member(team_id));

drop policy if exists "Laman ng setlist ng banda" on public.setlist_items;
create policy "Laman ng setlist ng banda" on public.setlist_items
  for select to authenticated using (public.can_view_setlist(setlist_id));

drop policy if exists "Kanta sa setlist ng banda" on public.songs;
create policy "Kanta sa setlist ng banda" on public.songs
  for select to authenticated using (public.song_in_team_setlist(id));

-- 4. Mga function para gumawa at sumali (dito lang puwedeng magdagdag ng miyembro)
create or replace function public.create_team(p_name text, p_display_name text, p_instrument text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Kailangang naka-login';
  end if;
  insert into public.teams (name, owner_id) values (trim(p_name), auth.uid()) returning id into new_id;
  insert into public.team_members (team_id, user_id, display_name, instrument, role)
  values (new_id, auth.uid(), trim(p_display_name), p_instrument, 'leader');
  return new_id;
end;
$$;

create or replace function public.team_by_code(p_code uuid)
returns table (id uuid, name text, member_count integer)
language sql stable security definer set search_path = '' as $$
  select t.id, t.name, (select count(*)::integer from public.team_members m where m.team_id = t.id)
  from public.teams t
  where t.invite_code = p_code and auth.uid() is not null;
$$;

create or replace function public.join_team(p_code uuid, p_display_name text, p_instrument text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  found_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Kailangang naka-login';
  end if;
  select t.id into found_id from public.teams t where t.invite_code = p_code;
  if found_id is null then
    raise exception 'Hindi mahanap ang banda. Baka luma na ang link.';
  end if;
  insert into public.team_members (team_id, user_id, display_name, instrument)
  values (found_id, auth.uid(), trim(p_display_name), p_instrument)
  on conflict (team_id, user_id)
  do update set display_name = excluded.display_name, instrument = excluded.instrument;
  return found_id;
end;
$$;

-- 5. Mga pahintulot. Walang insert sa teams at team_members; dadaan sa mga function sa itaas.
grant select, delete on public.teams, public.team_members to authenticated;
grant update (name, invite_code) on public.teams to authenticated;
grant update (display_name, instrument) on public.team_members to authenticated;

revoke all on function public.is_team_member(uuid), public.is_team_leader(uuid),
  public.can_view_setlist(uuid), public.song_in_team_setlist(uuid),
  public.create_team(text, text, text), public.team_by_code(uuid), public.join_team(uuid, text, text)
  from public, anon;
grant execute on function public.is_team_member(uuid), public.is_team_leader(uuid),
  public.can_view_setlist(uuid), public.song_in_team_setlist(uuid),
  public.create_team(text, text, text), public.team_by_code(uuid), public.join_team(uuid, text, text)
  to authenticated;
