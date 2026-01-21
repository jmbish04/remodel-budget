CREATE TABLE IF NOT EXISTS RenovationScope (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  critical_constraint TEXT NOT NULL,
  permit_type TEXT NOT NULL,
  regulatory_flags TEXT NOT NULL,
  target_cost REAL NOT NULL,
  est_value_add REAL NOT NULL,
  contractor_bid REAL,
  timeline_weeks INTEGER,
  ai_risk_assessment TEXT
);
