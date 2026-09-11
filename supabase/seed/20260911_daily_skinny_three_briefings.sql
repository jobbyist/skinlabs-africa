-- Seed applied live via MCP execute_sql + apply_migration on 2026-09-11
-- slugs: pollen-season-skin-south-africa, sa-medical-aid-dermatology-cover, december-holiday-skin-barrier-repair
SELECT slug FROM news_articles WHERE slug IN (
  'pollen-season-skin-south-africa',
  'sa-medical-aid-dermatology-cover',
  'december-holiday-skin-barrier-repair'
);
