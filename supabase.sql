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

-- Fotos de progresso (opcional). Rode também esta parte para guardar fotos no check-in.
-- Cada usuário só vê, envia e apaga as fotos da própria pasta (o nome da pasta é o id do usuário).
insert into storage.buckets (id, name, public)
values ('fotos-progresso', 'fotos-progresso', false)
on conflict (id) do nothing;

drop policy if exists "fotos: ler as próprias" on storage.objects;
drop policy if exists "fotos: enviar as próprias" on storage.objects;
drop policy if exists "fotos: apagar as próprias" on storage.objects;

create policy "fotos: ler as próprias" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-progresso' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: enviar as próprias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-progresso' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: apagar as próprias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-progresso' and (storage.foldername(name))[1] = (select auth.uid())::text);
