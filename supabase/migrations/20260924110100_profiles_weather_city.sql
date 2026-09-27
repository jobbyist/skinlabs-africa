-- City for the dashboard's "Today's skin weather" card.
--
-- Deliberately separate from profiles.city, which is the free-text ADDRESS
-- city (any town, e.g. Stellenbosch) — saving a weather city must never
-- overwrite someone's address. Only the 10 supported city keys are allowed
-- (city level only, per POPIA — no coordinates are ever stored). When unset,
-- the card falls back to profiles.city if it names one of the ten, then to
-- Johannesburg.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weather_city_key text
    CHECK (weather_city_key IS NULL OR weather_city_key IN (
      'johannesburg', 'pretoria', 'cape-town', 'durban', 'gqeberha',
      'bloemfontein', 'east-london', 'polokwane', 'mbombela', 'kimberley'));

COMMENT ON COLUMN public.profiles.weather_city_key IS
  'Supported SA city key for the skin-weather card. City level only; never coordinates.';

-- profiles uses column-level UPDATE grants for authenticated users.
GRANT UPDATE (weather_city_key) ON public.profiles TO authenticated;
