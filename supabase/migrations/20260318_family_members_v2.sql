-- ═══════════════════════════════════════════════════════════════
-- Migration: family_members — add invite fields
-- Date: 2026-03-18
--
-- Original schema only had (id, owner_user_id, member_user_id).
-- Invite flow requires: child_id, invited_email, status, invited_at, accepted_at
-- member_user_id must be nullable (null until invitee accepts)
-- ═══════════════════════════════════════════════════════════════

-- 1. Make member_user_id nullable (needed for pending invites)
alter table family_members
  alter column member_user_id drop not null;

-- 2. Add invite columns (safe if already exists)
alter table family_members
  add column if not exists child_id       uuid references children(id) on delete cascade,
  add column if not exists invited_email  text,
  add column if not exists status         text not null default 'active'
                           check (status in ('pending', 'active')),
  add column if not exists invited_at     timestamptz default now(),
  add column if not exists accepted_at    timestamptz;

-- 3. Set existing rows (created before invite flow) to 'active'
update family_members set status = 'active' where status is null or status = 'active';

-- 4. Unique constraint: one invite per email per child
alter table family_members
  drop constraint if exists family_members_child_id_invited_email_key;
alter table family_members
  add constraint family_members_child_id_invited_email_key
  unique (child_id, invited_email);

-- 5. Index on child_id for family circle lookup
create index if not exists idx_family_members_child_id
  on family_members (child_id);

-- 6. Update RLS: allow service-role inserts for invite creation
-- (edge functions use service role, so RLS is bypassed — no change needed)
