-- The Founding Member offer is withdrawn. resolveCharge() also refuses it, but
-- deactivating the row keeps it out of every read as well. Existing holders
-- (profiles.founding_member) keep their benefits.
UPDATE public.founding_member_offers SET is_active = false WHERE is_active = true;
