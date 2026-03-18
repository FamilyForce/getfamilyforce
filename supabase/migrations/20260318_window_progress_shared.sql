-- ═══════════════════════════════════════════════════════════════
-- Migration: window_progress — shared per child (not per user)
-- Date: 2026-03-18
--
-- Change: progress state is now shared across all family members
-- for a given child+window. One row per (child_id, window_id).
--
-- Before: unique (user_id, child_id, window_id) — each user had
--         their own independent progress row per window.
-- After:  unique (child_id, window_id) — one shared row per window
--         per child. updated_by_user_id tracks who made each change.
--
-- RLS changes:
--   - Family members can now INSERT and UPDATE (not just SELECT)
--   - "own" policy updated to match by child ownership, not user_id row match
-- ═══════════════════════════════════════════════════════════════

-- 1. Drop old unique constraint
alter table window_progress
  drop constraint if exists window_progress_user_id_child_id_window_id_key;

-- 2. Deduplicate: if multiple users marked the same child+window,
--    keep the row with the highest-priority status, then most recent.
--    Priority: completed > skipped > in_progress > open
delete from window_progress wp
where id not in (
  select distinct on (child_id, window_id) id
  from window_progress
  order by
    child_id,
    window_id,
    case status
      when 'completed'   then 1
      when 'skipped'     then 2
      when 'in_progress' then 3
      when 'open'        then 4
      else 5
    end asc,
    updated_at desc
);

-- 3. Add new unique constraint on (child_id, window_id)
alter table window_progress
  add constraint window_progress_child_id_window_id_key
  unique (child_id, window_id);

-- 4. Update indexes
drop index if exists idx_window_progress_user_child;
create index if not exists idx_window_progress_child_window
  on window_progress (child_id, window_id);

-- 5. Update RLS policies
drop policy if exists "Users can manage own window progress"     on window_progress;
drop policy if exists "Family members can read shared child progress" on window_progress;

-- Child owner: full CRUD for any window under their child
create policy "Child owner can manage window progress"
  on window_progress for all
  using (
    exists (
      select 1 from children c
      where c.id = window_progress.child_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from children c
      where c.id = window_progress.child_id
        and c.user_id = auth.uid()
    )
  );

-- Family members: full CRUD for shared child's progress
create policy "Family members can manage shared child progress"
  on window_progress for all
  using (
    exists (
      select 1 from family_members fm
      where fm.child_id = window_progress.child_id
        and fm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from family_members fm
      where fm.child_id = window_progress.child_id
        and fm.user_id = auth.uid()
    )
  );
