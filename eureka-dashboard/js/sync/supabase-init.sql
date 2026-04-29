-- ============================================================
-- Eureka Dashboard 数据库初始化脚本
-- 在 Supabase 后台 SQL Editor 中执行
-- ============================================================

-- 1. 用户档案表（登录用户才有）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. 用户项目数据表
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_name text not null default '未命名项目',
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- 3. 创建 updated_at 自动更新触发器
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- 4. 启用行级安全策略 (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- 5. profiles 策略：用户只能读写自己的档案
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 6. projects 策略：用户只能读写自己的项目
drop policy if exists "Users can view own projects" on public.projects;
drop policy if exists "Users can insert own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- 7. 自动创建 profile（用户登录时触发）
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. 允许匿名读取（不需要登录也能查询公开数据，但写入需要认证）
-- projects 表的匿名读取已由 RLS 控制，未登录用户会被拒绝写入，这是正确的行为
