-- ============================================================
-- NXTY Fightwear — Database Schema
-- ============================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://app.supabase.com)
-- setelah project dibuat. Semua tabel untuk admin panel + customer.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories(slug);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  price integer not null,
  original_price integer,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  rating numeric(2,1) not null default 4.5,
  reviews_count integer not null default 0,
  featured boolean not null default false,
  in_stock boolean not null default true,
  weight_grams integer not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_featured on public.products(featured) where featured = true;
create index if not exists idx_products_in_stock on public.products(in_stock) where in_stock = true;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- PRODUCT IMAGES (multiple per product, sortable)
-- ============================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product
  on public.product_images(product_id, sort_order);

-- ============================================================
-- PROMOTIONS
-- ============================================================
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('banner','flash_sale','voucher','bundle','add_on')),
  title text not null,
  subtitle text,
  description text,
  image text,
  badge text,
  discount_type text check (discount_type in ('percentage','fixed')),
  discount_value numeric,
  min_purchase integer,
  flash_price integer,
  flash_stock integer,
  product_ids uuid[] not null default '{}',
  end_time timestamptz,
  cta_label text,
  cta_href text,
  priority integer not null default 99,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_promotions_type on public.promotions(type);
create index if not exists idx_promotions_end_time on public.promotions(end_time);

drop trigger if exists trg_promotions_updated_at on public.promotions;
create trigger trg_promotions_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id text primary key,                -- "NXTY-{ts}-{rand}"
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,              -- JSON stringified
  notes text,
  subtotal integer,
  shipping_cost integer,
  total integer,
  status text not null default 'pending'
    check (status in ('pending','paid','processed','shipped','delivered','cancelled')),
  items jsonb not null default '[]'::jsonb,
  shipping jsonb,
  payment_id text,                    -- Midtrans transaction ID
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_email on public.orders(customer_email);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- CUSTOMER PROFILES (1-to-1 dengan auth.users)
-- ============================================================
create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  default_address_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- CUSTOMER ADDRESSES (1-to-many)
-- ============================================================
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_addresses_customer
  on public.customer_addresses(customer_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Aktifkan RLS tapi izinkan baca publik untuk storefront.
-- Write hanya via service role (server-side).

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;

-- Public read untuk konten toko
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
  on public.categories for select using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
  on public.products for select using (true);

drop policy if exists "Public read product_images" on public.product_images;
create policy "Public read product_images"
  on public.product_images for select using (true);

drop policy if exists "Public read promotions" on public.promotions;
create policy "Public read promotions"
  on public.promotions for select using (true);

-- Orders: customer hanya bisa lihat order miliknya
drop policy if exists "Customer read own orders" on public.orders;
create policy "Customer read own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

-- Customer profiles: user hanya bisa lihat/edit miliknya
drop policy if exists "Customer read own profile" on public.customer_profiles;
create policy "Customer read own profile"
  on public.customer_profiles for select
  using (auth.uid() = id);

drop policy if exists "Customer update own profile" on public.customer_profiles;
create policy "Customer update own profile"
  on public.customer_profiles for update
  using (auth.uid() = id);

drop policy if exists "Customer insert own profile" on public.customer_profiles;
create policy "Customer insert own profile"
  on public.customer_profiles for insert
  with check (auth.uid() = id);

-- Customer addresses: user hanya bisa CRUD miliknya
drop policy if exists "Customer CRUD own addresses" on public.customer_addresses;
create policy "Customer CRUD own addresses"
  on public.customer_addresses for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Bucket `product-images` harus dibuat via Dashboard Supabase:
-- 1. Buka Storage → New bucket
-- 2. Name: product-images
-- 3. Public bucket: ON (centang "Public bucket")
-- 4. File size limit: 5 MB
-- 5. Allowed MIME types: image/*
--
-- Setelah bucket dibuat, jalankan SQL ini untuk policy storage:

-- insert into storage.buckets (id, name, public)
-- values ('product-images', 'product-images', true)
-- on conflict (id) do nothing;

-- drop policy if exists "Public read product-images" on storage.objects;
-- create policy "Public read product-images"
--   on storage.objects for select
--   using (bucket_id = 'product-images');

-- drop policy if exists "Admin upload product-images" on storage.objects;
-- create policy "Admin upload product-images"
--   on storage.objects for insert
--   with check (bucket_id = 'product-images');
