-- Meldingen (bugs en ideeën) van 10 op en neer. Versie 1 (v2.58). Opnieuw uitvoeren mag.
-- Plak dit in Supabase onder SQL Editor > New query en klik op Run.
--
-- Daarna één keer je eigen beheercode instellen (kies zelf iets lang en geheims, zet het NIET in de repository):
--   insert into public.meldingen_beheer (id, code) values (1, 'JOUW-GEHEIME-CODE')
--   on conflict (id) do update set code = excluded.code;
-- Met die code lees je de meldingen op https://robbert-coder.github.io/10-op-en-neer/meldingen.html
--
-- De tabellen zijn afgeschermd; de app kan alleen via de functies hieronder schrijven, en lezen kan alleen
-- met de beheercode.

create table if not exists public.meldingen (
  id bigserial primary key,
  kind text not null,
  text text not null,
  version text,
  device text,
  name text,
  shot text,
  klaar boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists meldingen_created on public.meldingen (created_at desc);

create table if not exists public.meldingen_beheer (
  id int primary key check (id = 1),
  code text not null check (char_length(code) >= 12)
);

alter table public.meldingen enable row level security;
alter table public.meldingen_beheer enable row level security;
revoke all on public.meldingen, public.meldingen_beheer from anon, authenticated;

-- Een melding insturen. Grenzen gelijk aan feedback.js; hoogstens 60 meldingen per uur in totaal, tegen spam.
create or replace function public.put_melding(p_kind text, p_text text, p_version text, p_device text,
  p_name text, p_shot text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('bug', 'idee') or char_length(coalesce(p_text, '')) not between 3 and 2000
     or char_length(coalesce(p_version, '')) > 20 or char_length(coalesce(p_device, '')) > 300
     or char_length(coalesce(p_name, '')) > 24 or char_length(coalesce(p_shot, '')) > 900000
     or (coalesce(p_shot, '') <> '' and p_shot !~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+=*$') then
    raise exception 'ongeldige melding';
  end if;
  if (select count(*) from public.meldingen where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'te veel meldingen';
  end if;
  insert into public.meldingen (kind, text, version, device, name, shot)
  values (p_kind, p_text, nullif(p_version, ''), nullif(p_device, ''), nullif(p_name, ''), nullif(p_shot, ''));
end;
$$;

create or replace function public.melding_beheerder(p_code text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.meldingen_beheer where id = 1 and code = p_code);
$$;

-- Alle meldingen (nieuwste eerst), alleen met de beheercode; met een verkeerde code null
create or replace function public.get_meldingen(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.melding_beheerder(p_code) then
    perform pg_sleep(1);
    return null;
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'text', text, 'version', version,
    'device', device, 'name', name, 'shot', shot, 'klaar', klaar, 'date', created_at) order by created_at desc)
    from (select * from public.meldingen order by created_at desc limit 300) m), '[]'::jsonb);
end;
$$;

-- Een melding als afgehandeld (of weer open) markeren, alleen met de beheercode
create or replace function public.set_melding_klaar(p_code text, p_id bigint, p_klaar boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.melding_beheerder(p_code) then
    raise exception 'geen toegang';
  end if;
  update public.meldingen set klaar = p_klaar where id = p_id;
end;
$$;

revoke all on function public.melding_beheerder(text) from public, anon, authenticated;
grant execute on function public.put_melding(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_meldingen(text) to anon, authenticated;
grant execute on function public.set_melding_klaar(text, bigint, boolean) to anon, authenticated;
