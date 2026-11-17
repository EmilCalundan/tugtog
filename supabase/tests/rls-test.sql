-- Tugtog: pagsubok sa RLS ng banda (owner A, miyembro B, hindi kasali C).
-- Para sa lokal na Postgres na may pekeng auth schema (auth.users at auth.uid() na bumabasa ng request.jwt.claim.sub).
-- HUWAG patakbuhin sa totoong Supabase project: gumagawa at nagbubura ito ng test data.

\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned
insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-00000000000a'),('bbbbbbbb-0000-0000-0000-00000000000b'),('cccccccc-0000-0000-0000-00000000000c') on conflict do nothing;
-- linisin ang dating test
delete from public.teams where owner_id = 'aaaaaaaa-0000-0000-0000-00000000000a';
delete from public.setlists where owner_id in ('aaaaaaaa-0000-0000-0000-00000000000a','bbbbbbbb-0000-0000-0000-00000000000b');
delete from public.songs where owner_id in ('aaaaaaaa-0000-0000-0000-00000000000a','bbbbbbbb-0000-0000-0000-00000000000b');

create or replace function pg_temp.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false); $$;
set role authenticated;

-- A: kanta, setlist, banda
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');
insert into public.songs (id, title, artist, original_key, content) values ('11111111-0000-0000-0000-000000000001','Kanta ni A','','G','G D');
insert into public.setlists (id, title) values ('22222222-0000-0000-0000-000000000002','Linggo');
insert into public.setlist_items (setlist_id, song_id, position, song_key) values ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001',1,'A');
select 'A gumawa ng banda: ' || (public.create_team('Banda ni A','Emil','gitara') is not null);
select set_config('t.team', (select id::text from public.teams limit 1), false);
select set_config('t.code', (select invite_code::text from public.teams limit 1), false);
update public.setlists set team_id = current_setting('t.team')::uuid where id = '22222222-0000-0000-0000-000000000002';
select 'A naibahagi ang setlist: ' || (select team_id is not null from public.setlists where id='22222222-0000-0000-0000-000000000002');

-- C: hindi kasali
select pg_temp.as_user('cccccccc-0000-0000-0000-00000000000c');
select 'C nakikitang banda (dapat 0): ' || count(*) from public.teams;
select 'C nakikitang setlist ni A (dapat 0): ' || count(*) from public.setlists where id='22222222-0000-0000-0000-000000000002';
select 'C nakikitang kanta ni A (dapat 0): ' || count(*) from public.songs where id='11111111-0000-0000-0000-000000000001';
select 'C diretsong insert sa team_members (dapat error):';
insert into public.team_members (team_id, user_id, display_name) values (current_setting('t.team')::uuid, 'cccccccc-0000-0000-0000-00000000000c', 'C');
select 'C team_by_code na maling code (dapat 0): ' || count(*) from public.team_by_code(gen_random_uuid());

-- B: sasali gamit ang code
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-00000000000b');
select 'B preview ng banda: ' || name || ', ' || member_count || ' miyembro' from public.team_by_code(current_setting('t.code')::uuid);
select 'B sumali: ' || (public.join_team(current_setting('t.code')::uuid, 'Bea', 'bass') is not null);
select 'B nakikitang miyembro (dapat 2): ' || count(*) from public.team_members;
select 'B nakikitang setlist ng banda (dapat 1): ' || count(*) from public.setlists where id='22222222-0000-0000-0000-000000000002';
select 'B nakikitang laman ng setlist (dapat 1): ' || count(*) from public.setlist_items where setlist_id='22222222-0000-0000-0000-000000000002';
select 'B nakikitang kanta ni A (dapat 1): ' || count(*) from public.songs where id='11111111-0000-0000-0000-000000000001';
update public.songs set title='hack' where id='11111111-0000-0000-0000-000000000001';
select 'B nabago ang kanta ni A? (dapat false): ' || (select title='hack' from public.songs where id='11111111-0000-0000-0000-000000000001');
update public.setlists set title='hack' where id='22222222-0000-0000-0000-000000000002';
select 'B nabago ang setlist ni A? (dapat false): ' || (select title='hack' from public.setlists where id='22222222-0000-0000-0000-000000000002');
select 'B gagawing leader ang sarili (dapat error):';
update public.team_members set role='leader' where user_id=auth.uid();
update public.team_members set instrument='drums' where user_id=auth.uid();
select 'B napalitan ang sariling instrumento: ' || instrument from public.team_members where user_id=auth.uid();
delete from public.team_members where user_id='aaaaaaaa-0000-0000-0000-00000000000a';
select 'B natanggal si A? (dapat 2 pa rin): ' || count(*) from public.team_members;
insert into public.setlists (title, team_id) values ('B setlist', current_setting('t.team')::uuid);
select 'B nakapagbahagi ng sariling setlist sa banda: ' || count(*) from public.setlists where title='B setlist';

-- C: susubukang ibahagi sa bandang hindi kasali
select pg_temp.as_user('cccccccc-0000-0000-0000-00000000000c');
select 'C ibabahagi sa bandang hindi kasali (dapat error):';
insert into public.setlists (title, team_id) values ('C setlist', current_setting('t.team')::uuid);

-- A: hindi puwedeng umalis bilang may-ari; puwedeng magtanggal ng miyembro
select pg_temp.as_user('aaaaaaaa-0000-0000-0000-00000000000a');
delete from public.team_members where user_id='aaaaaaaa-0000-0000-0000-00000000000a';
select 'A umalis bilang may-ari? (dapat 2 pa rin): ' || count(*) from public.team_members;
delete from public.team_members where user_id='bbbbbbbb-0000-0000-0000-00000000000b';
select 'A tinanggal si B (dapat 1): ' || count(*) from public.team_members;

-- B: pagkatanggal, wala nang access
select pg_temp.as_user('bbbbbbbb-0000-0000-0000-00000000000b');
select 'B matapos tanggalin, kanta ni A (dapat 0): ' || count(*) from public.songs where id='11111111-0000-0000-0000-000000000001';

-- anon: walang access
reset role; set role anon;
select 'anon team_by_code (dapat error):';
select * from public.team_by_code(current_setting('t.code')::uuid);
