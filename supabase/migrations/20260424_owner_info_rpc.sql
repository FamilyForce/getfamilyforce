-- RPC: get_owner_info_for_family_member
-- Called by family members to see the primary account's name + email.
-- SECURITY DEFINER so it can read auth.users.
-- Enforces: caller must be an active family_member of the child.

CREATE OR REPLACE FUNCTION get_owner_info_for_family_member(p_child_id uuid)
RETURNS TABLE (owner_email text, owner_name text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify caller is an active family member of this child
  IF NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE child_id = p_child_id
      AND member_user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    au.email::text               AS owner_email,
    p.name::text                 AS owner_name
  FROM children c
  JOIN auth.users au ON au.id = c.user_id
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.id = p_child_id;
END;
$$;
