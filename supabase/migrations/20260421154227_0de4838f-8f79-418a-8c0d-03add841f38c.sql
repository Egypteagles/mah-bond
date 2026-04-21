create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
  done boolean := false;
begin
  while not done loop
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    done := not exists(select 1 from public.families where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;