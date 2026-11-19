-- Tugtog: sariling strum pattern bawat kanta (hal. D-DU-UDU).
-- Walang laman (null) = ayon sa style ng kanta.
-- 4/4: 8 titik (bawat eighth note). 6/8: 12 titik (bawat 16th note).
-- D = pababa, U = pataas, x = chuck (pinipigilan ng palad), - = pahinga
alter table public.songs
  add column if not exists strum text
    check (strum is null or strum ~ '^[DUx-]{8}$' or strum ~ '^[DUx-]{12}$');
