-- Rode isto uma vez no SQL Editor do projeto Supabase do app de dieta.
-- Guarda todo o estado do app (plano, metas, dias, extras e check-ins) em uma linha por usuário.

create table if not exists public.dieta_estado (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dieta_estado enable row level security;

drop policy if exists "dieta: ler o próprio" on public.dieta_estado;
drop policy if exists "dieta: criar o próprio" on public.dieta_estado;
drop policy if exists "dieta: atualizar o próprio" on public.dieta_estado;
drop policy if exists "dieta: apagar o próprio" on public.dieta_estado;

create policy "dieta: ler o próprio" on public.dieta_estado
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dieta: criar o próprio" on public.dieta_estado
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dieta: atualizar o próprio" on public.dieta_estado
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dieta: apagar o próprio" on public.dieta_estado
  for delete to authenticated using ((select auth.uid()) = user_id);
