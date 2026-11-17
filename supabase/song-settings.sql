-- Tugtog: settings bawat kanta (tempo, time signature, strum style)
alter table public.songs
  add column if not exists bpm integer not null default 72
    check (bpm between 40 and 200),
  add column if not exists time_signature text not null default '4/4'
    check (time_signature in ('4/4', '6/8')),
  add column if not exists style text not null default 'ballad'
    check (style in ('ballad', 'pop', 'rock', 'reggae'));
