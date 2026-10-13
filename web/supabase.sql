-- Database voor de online statistieken van 10 op en neer.
-- Plak dit in Supabase onder SQL Editor > New query en klik op Run. Opnieuw uitvoeren mag.
-- Hooguit 400 kB per code: ruim genoeg voor 1000 spellen, te weinig om de database vol te schrijven.
-- De tabel zelf is afgeschermd; de app kan alleen via deze twee functies lezen en schrijven,
-- en alleen bij de persoonlijke code van twaalf tekens die je moet kennen.

create table if not exists public.statistiek (
  code text primary key check (char_length(code) = 12),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.statistiek enable row level security;

create or replace function public.get_stats(p_code text) returns jsonb
language sql security definer set search_path = public as $$
  select data from public.statistiek where code = p_code;
$$;

create or replace function public.put_stats(p_code text, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-Z2-9]{12}$' or pg_column_size(p_data) > 400000 then
    raise exception 'ongeldige code of te veel gegevens';
  end if;
  insert into public.statistiek (code, data, updated_at) values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now();
end;
$$;

revoke all on public.statistiek from anon, authenticated;
grant execute on function public.get_stats(text) to anon;
grant execute on function public.put_stats(text, jsonb) to anon;
