-- Hall of Fame van 10 op en neer: de beste scores en spelers van iedereen.
-- Plak dit in Supabase onder SQL Editor > New query en klik op Run (na supabase.sql).
-- De tabellen zijn afgeschermd; de app kan alleen via de functies hieronder lezen en schrijven.

create table if not exists public.hof_scores (
  id bigserial primary key,
  player text not null,
  game_id text not null,
  name text not null,
  avatar text,
  list text not null,
  score int not null,
  detail text,
  created_at timestamptz not null default now(),
  unique (player, game_id)
);
create index if not exists hof_scores_list on public.hof_scores (list, score desc);

create table if not exists public.hof_players (
  player text primary key,
  name text not null,
  avatar text,
  stats jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.hof_scores enable row level security;
alter table public.hof_players enable row level security;
revoke all on public.hof_scores, public.hof_players from anon, authenticated;

create or replace function public.hof_check(p_player text, p_name text, p_avatar text) returns void
language plpgsql as $$
begin
  if p_player !~ '^[A-Za-z0-9]{16}$' or char_length(coalesce(p_name, '')) not between 1 and 24
     or char_length(coalesce(p_avatar, '')) > 16 then
    raise exception 'ongeldige speler';
  end if;
end;
$$;

-- Een uitgespeeld spel; hetzelfde spel twee keer insturen telt één keer
create or replace function public.hof_put_score(p_player text, p_game text, p_name text, p_avatar text,
  p_list text, p_score int, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.hof_check(p_player, p_name, p_avatar);
  if p_list !~ '^(10openneer|boerenbridge|hybride)(\.kort)?$' or p_score not between 0 and 1000
     or char_length(p_game) > 100 or char_length(coalesce(p_detail, '')) > 60 then
    raise exception 'ongeldige score';
  end if;
  insert into public.hof_scores (player, game_id, name, avatar, list, score, detail)
  values (p_player, p_game, p_name, nullif(p_avatar, ''), p_list, p_score, nullif(p_detail, ''))
  on conflict (player, game_id) do nothing;
  -- Naam en plaatje gelden voor al je scores
  update public.hof_scores set name = p_name, avatar = nullif(p_avatar, '') where player = p_player;
end;
$$;

-- Je overzicht (aantal spellen, gewonnen, goed voorspeld, gemiddelde plaats) voor de beste spelers
create or replace function public.hof_put_player(p_player text, p_name text, p_avatar text, p_stats jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.hof_check(p_player, p_name, p_avatar);
  if pg_column_size(p_stats) > 2000 then raise exception 'te veel gegevens'; end if;
  insert into public.hof_players (player, name, avatar, stats, updated_at)
  values (p_player, p_name, nullif(p_avatar, ''), p_stats, now())
  on conflict (player) do update set name = excluded.name, avatar = excluded.avatar, stats = excluded.stats, updated_at = now();
  update public.hof_scores set name = p_name, avatar = nullif(p_avatar, '') where player = p_player;
end;
$$;

-- De beste score per speler in een lijst (hoogstens 50), en de spelers met minstens één volledig spel
create or replace function public.hof_get(p_list text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'scores', coalesce((select jsonb_agg(s order by s.score desc, s.date) from (
      select * from (
        select distinct on (player) player as p, name, avatar, score, detail, created_at::date as date
        from public.hof_scores where list = p_list order by player, score desc, created_at
      ) best order by score desc, date limit 50
    ) s), '[]'::jsonb),
    'players', coalesce((select jsonb_agg(jsonb_build_object('p', player, 'name', name, 'avatar', avatar, 'stats', stats))
      from (select * from public.hof_players where (stats->>'g')::int >= 1 order by updated_at desc limit 500) x), '[]'::jsonb)
  );
$$;

grant execute on function public.hof_put_score(text, text, text, text, text, int, text) to anon;
grant execute on function public.hof_put_player(text, text, text, jsonb) to anon;
grant execute on function public.hof_get(text) to anon;
