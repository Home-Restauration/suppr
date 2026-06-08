-- Professional resume/portfolio fields for chef profiles.
-- Stored as a single flexible JSONB column to avoid table churn
-- as the profile grows. Structure:
--
-- {
--   "years_experience":  12,
--   "background":        "Former sous chef at Atelier Crenn. Trained in Tokyo for 3 years...",
--   "past_venues":       ["Atelier Crenn", "Noma", "Chez Panisse"],
--   "certifications":    ["CIA graduate", "Certified Executive Chef (ACF)"],
--   "awards":            ["Best New Chef — Food & Wine 2020", "Michelin Bib 2022"],
--   "press": [
--     { "publication": "New York Times", "headline": "...", "url": "...", "year": 2023 }
--   ],
--   "cookbooks": [
--     { "title": "The Living Kitchen", "year": 2021, "publisher": "Ten Speed", "cover_url": "..." }
--   ]
-- }
--
-- This field is public-facing (the "resume side" of the chef profile page).
-- The AI onboarding step (POST /chef/onboard/profile-import) populates it
-- from LLM-generated content on first import.

ALTER TABLE public.chef_profiles
  ADD COLUMN IF NOT EXISTS professional jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN chef_profiles.professional IS
  'Public-facing resume/portfolio: years_experience, background, past_venues, certifications, awards, press[], cookbooks[]';
