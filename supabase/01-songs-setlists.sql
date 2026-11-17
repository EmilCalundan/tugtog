-- Tugtog: unang schema (Project 2)
-- Mga kanta, setlist, at share link. Patakbuhin ito muna, tapos ang song-settings.sql at teams.sql.

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  artist text not null default '',
  original_key text not null default 'G',
  content text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  share_id uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  position integer not null default 0,
  song_key text not null,
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_items enable row level security;

-- Sariling kanta lang ang nakikita at nababago
drop policy if exists "Makikita ang sariling kanta" on public.songs;
create policy "Makikita ang sariling kanta" on public.songs for select using (auth.uid() = owner_id);
drop policy if exists "Makakagawa ng sariling kanta" on public.songs;
create policy "Makakagawa ng sariling kanta" on public.songs for insert with check (auth.uid() = owner_id);
drop policy if exists "Mababago ang sariling kanta" on public.songs;
create policy "Mababago ang sariling kanta" on public.songs for update using (auth.uid() = owner_id);
drop policy if exists "Mabubura ang sariling kanta" on public.songs;
create policy "Mabubura ang sariling kanta" on public.songs for delete using (auth.uid() = owner_id);

drop policy if exists "Sariling setlist" on public.setlists;
create policy "Sariling setlist" on public.setlists
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Sariling kanta lang ang maidadagdag sa sariling setlist
drop policy if exists "Laman ng sariling setlist" on public.setlist_items;
create policy "Laman ng sariling setlist" on public.setlist_items
  using (exists (select 1 from public.setlists s where s.id = setlist_id and s.owner_id = auth.uid()))
  with check (
    exists (select 1 from public.setlists s where s.id = setlist_id and s.owner_id = auth.uid())
    and exists (select 1 from public.songs g where g.id = song_id and g.owner_id = auth.uid())
  );

grant select, insert, update, delete on public.songs, public.setlists, public.setlist_items to authenticated;

-- Share link: kahit sino na may link ay makakabasa ng isang setlist, at iyon lang
create or replace function public.get_shared_setlist(p_share_id uuid)
returns table (setlist_title text, item_position integer, song_key text, title text, artist text, original_key text, content text)
language sql stable security definer set search_path = '' as $$
  select s.title, i.position, i.song_key, g.title, g.artist, g.original_key, g.content
  from public.setlists s
  join public.setlist_items i on i.setlist_id = s.id
  join public.songs g on g.id = i.song_id
  where s.share_id = p_share_id
  order by i.position, i.created_at;
$$;

revoke all on function public.get_shared_setlist(uuid) from public;
grant execute on function public.get_shared_setlist(uuid) to anon, authenticated;
