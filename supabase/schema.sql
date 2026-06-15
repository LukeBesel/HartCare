-- ============================================================================
-- HartCare — Supabase schema
-- Premium health, wellness, fitness, nutrition & care platform.
--
-- Run in the Supabase SQL editor. Designed for multi-tenant households with
-- row-level security so members only ever see their own household's data.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type member_role as enum ('parent', 'adult', 'child', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_tier as enum ('free', 'premium', 'family');
exception when duplicate_object then null; end $$;

-- Households -----------------------------------------------------------------
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Profiles (one auth user can own several profiles in a household) -----------
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  role member_role not null default 'adult',
  avatar text,
  color text default '#2a59d6',
  birthdate date,
  created_at timestamptz not null default now()
);

-- Household membership / permissions -----------------------------------------
create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role member_role not null default 'adult',
  can_manage_billing boolean not null default false,
  can_manage_members boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Helper: is the current user a member of the given household? ---------------
create or replace function is_household_member(hid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  ) or exists (
    select 1 from households h
    where h.id = hid and h.owner_id = auth.uid()
  );
$$;

-- Per-profile & per-household data tables ------------------------------------
create table if not exists health_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  height_cm numeric, blood_type text, resting_heart_rate int, notes text
);

create table if not exists weights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, lbs numeric not null, body_fat numeric
);

create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, part text not null, inches numeric not null
);

create table if not exists vitals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, type text not null,
  value numeric not null, value2 numeric, unit text, label text, note text
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  title text not null, category text not null,
  target numeric not null, current numeric not null default 0, unit text, due date
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  name text not null, category text, level text, day text,
  exercises jsonb not null default '[]'
);

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  workout_id uuid references workouts (id) on delete set null,
  date date not null, name text, duration_min int, calories int, completed boolean default true
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null, muscle text, type text, sets int, reps int, rest_sec int, video_url text
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade,
  name text not null, tags text[] default '{}', servings int default 1,
  calories int, protein int, carbs int, fat int,
  ingredients text[] default '{}', instructions text[] default '{}',
  favorite boolean default false, ai_generated boolean default false
);

create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, meal text not null, name text,
  calories int, protein int, carbs int, fat int, fiber int,
  recipe_id uuid references recipes (id) on delete set null
);

create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null, qty text, category text, checked boolean default false
);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, oz numeric not null
);

create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, hours numeric not null, quality int, bedtime text, wake text
);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  for_pet boolean default false,
  name text not null, dosage text, frequency text, next_dose text, refill_date date, active boolean default true
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  for_pet boolean default false,
  type text, title text not null, provider text, date date not null, time text, location text, notes text
);

create table if not exists allergies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  name text not null, severity text, reaction text
);

create table if not exists conditions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  name text not null, since text, notes text
);

create table if not exists moods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, mood int, stress int, note text, gratitude text
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  name text not null, icon text, streak int default 0, done_dates date[] default '{}', target text
);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null, species text, breed text, birthdate date, weight_lbs numeric, avatar text, notes text
);

create table if not exists pet_medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  name text not null, dosage text, frequency text, refill_date date, active boolean default true
);

create table if not exists pet_weights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  date date not null, lbs numeric not null
);

create table if not exists pet_vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  name text not null, date date, next_due date
);

create table if not exists pet_feeding (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  food text, amount text, schedule text
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade,
  profile_id uuid references profiles (id) on delete cascade,
  kind text, title text not null, body text, date date default now(), read boolean default false
);

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null, url text not null, note text
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade unique,
  tier plan_tier not null default 'free',
  status text not null default 'active',
  hart_home_connected boolean default false,
  renews_on date, seats int default 1,
  stripe_customer_id text, stripe_subscription_id text
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade unique,
  theme text default 'system', units text default 'imperial',
  notifications_enabled boolean default true,
  water_goal_oz int default 100, step_goal int default 10000, sleep_goal_hours int default 8
);

-- Row level security ----------------------------------------------------------
-- Every per-profile table is reachable only by members of the owning household.
do $$
declare t text;
  profile_tables text[] := array[
    'health_profiles','weights','measurements','vitals','goals','workouts','workout_sessions',
    'meal_plans','water_logs','sleep_logs','medications','appointments','allergies',
    'conditions','moods','habits','progress_photos','settings'
  ];
  household_tables text[] := array['recipes','grocery_items','pets','notifications','subscriptions'];
  pet_tables text[] := array['pet_medications','pet_weights','pet_vaccinations','pet_feeding'];
begin
  -- Households & profiles
  execute 'alter table households enable row level security';
  execute 'drop policy if exists hh_access on households';
  execute 'create policy hh_access on households for all using (is_household_member(id)) with check (is_household_member(id))';

  execute 'alter table profiles enable row level security';
  execute 'drop policy if exists profile_access on profiles';
  execute 'create policy profile_access on profiles for all using (is_household_member(household_id)) with check (is_household_member(household_id))';

  execute 'alter table household_members enable row level security';
  execute 'drop policy if exists hm_access on household_members';
  execute 'create policy hm_access on household_members for all using (is_household_member(household_id)) with check (is_household_member(household_id))';

  -- Per-profile tables (join through profiles)
  foreach t in array profile_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_access', t);
    execute format(
      'create policy %I on %I for all using (exists (select 1 from profiles p where p.id = %I.profile_id and is_household_member(p.household_id))) with check (exists (select 1 from profiles p where p.id = %I.profile_id and is_household_member(p.household_id)))',
      t || '_access', t, t, t);
  end loop;

  -- Household-scoped tables
  foreach t in array household_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_access', t);
    execute format(
      'create policy %I on %I for all using (is_household_member(household_id)) with check (is_household_member(household_id))',
      t || '_access', t);
  end loop;

  -- Pet sub-tables (join through pets)
  foreach t in array pet_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_access', t);
    execute format(
      'create policy %I on %I for all using (exists (select 1 from pets pt where pt.id = %I.pet_id and is_household_member(pt.household_id))) with check (exists (select 1 from pets pt where pt.id = %I.pet_id and is_household_member(pt.household_id)))',
      t || '_access', t, t, t);
  end loop;
end $$;

-- Helpful indexes -------------------------------------------------------------
create index if not exists idx_profiles_household on profiles (household_id);
create index if not exists idx_weights_profile_date on weights (profile_id, date);
create index if not exists idx_water_profile_date on water_logs (profile_id, date);
create index if not exists idx_sleep_profile_date on sleep_logs (profile_id, date);
create index if not exists idx_meals_profile_date on meal_plans (profile_id, date);
create index if not exists idx_appts_profile_date on appointments (profile_id, date);

-- ============================================================================
-- New-user bootstrap: create a household, owner profile, membership,
-- free subscription and default settings whenever a user signs up.
-- ============================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare new_household uuid; new_profile uuid;
begin
  insert into households (name, owner_id)
    values (coalesce(new.raw_user_meta_data->>'household_name', 'My Household'), new.id)
    returning id into new_household;

  insert into household_members (household_id, user_id, role, can_manage_billing, can_manage_members)
    values (new_household, new.id, 'parent', true, true);

  insert into profiles (user_id, household_id, name, role)
    values (new.id, new_household,
            coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'parent')
    returning id into new_profile;

  insert into subscriptions (household_id, tier, status) values (new_household, 'free', 'active');
  insert into settings (profile_id) values (new_profile);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
