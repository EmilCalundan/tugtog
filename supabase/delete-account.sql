-- Tugtog: pagbura ng sariling account
-- Binubura ang user sa auth.users. Dahil "on delete cascade" ang mga foreign key,
-- kasamang nabubura ang mga kanta, setlist, membership, at mga bandang siya ang may-ari.

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Kailangang naka-login';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
