-- Add upvotes counter to feature_requests so admins can prioritise.
ALTER TABLE public.feature_requests
  ADD COLUMN IF NOT EXISTS upvotes int NOT NULL DEFAULT 0;
