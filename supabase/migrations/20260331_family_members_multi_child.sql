-- Migration: family_members — allow member to follow multiple children
-- Date: 2026-03-31
-- Reason: one_family_per_member (UNIQUE member_user_id) was too restrictive —
--   it blocked a family member (e.g. grandparent) from being invited to
--   follow more than one child, even across different owner accounts.
--   Also dropped owner+member unique (no child) for the same reason.
--   Replaced with (owner_user_id, member_user_id, child_id) — correct cardinality.
--
-- Applied directly via Supabase Management API on 2026-03-31.

-- Drop over-restrictive constraints
alter table family_members
  drop constraint if exists one_family_per_member;

alter table family_members
  drop constraint if exists family_members_owner_user_id_member_user_id_key;

-- Add correct unique constraint: one row per (owner, member, child)
alter table family_members
  add constraint if not exists family_members_owner_member_child_key
  unique (owner_user_id, member_user_id, child_id);
