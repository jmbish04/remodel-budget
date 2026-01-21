INSERT INTO RenovationScope (
  item_name,
  category,
  critical_constraint,
  permit_type,
  regulatory_flags,
  target_cost,
  est_value_add
) VALUES
  ('Lot Line Skylight', 'Deal Killer', 'Code 705.8: <3ft from lot line', 'Full Plan Check', 'Fire Marshal', 14000, 35000),
  ('Illegal Plumbing', 'Deal Killer', 'Code 1101.2: Roof drain sewage', 'OTC', 'Code Violation', 12000, 25000),
  ('Backyard Drainage', 'Phase 1 Essential', 'Clay Soil (50% surcharge)', 'OTC', 'Soil Conditions', 10000, 25000),
  ('Ceiling Raise', 'Phase 1 Essential', 'Relocate pipes, finish to 9.5ft', 'OTC with Plans', 'None', 6500, 75000),
  ('JADU Conversion', 'Phase 1 Essential', 'Separate exterior entrance', 'OTC with Plans', 'None', 75000, 175000),
  ('Juliette Deck', 'Phase 2 Discretionary', 'No Section 311 required', 'OTC with Plans', 'None', 16600, 13000),
  ('Full Enclosure', 'Phase 2 Discretionary', 'Violates rear yard setback', 'Site Permit', 'Section 311', 166000, 115000);
