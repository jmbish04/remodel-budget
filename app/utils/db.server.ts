import type { D1Database } from "@cloudflare/workers-types";

export type RenovationScope = {
  id: number;
  item_name: string;
  category: "Phase 1 Essential" | "Phase 2 Discretionary" | "Deal Killer";
  critical_constraint: string;
  permit_type: "OTC" | "OTC with Plans" | "Full Plan Check" | "Site Permit";
  regulatory_flags: string;
  target_cost: number;
  est_value_add: number;
  contractor_bid: number | null;
  timeline_weeks: number | null;
  ai_risk_assessment: string | null;
};

export async function getRenovationScope(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT id, item_name, category, critical_constraint, permit_type, regulatory_flags, target_cost, est_value_add, contractor_bid, timeline_weeks, ai_risk_assessment
       FROM RenovationScope
       ORDER BY id`
    )
    .all<RenovationScope>();
  return results ?? [];
}

export async function updateRenovationBid(
  db: D1Database,
  id: number,
  contractorBid: number | null,
  timelineWeeks: number | null
) {
  await db
    .prepare(
      `UPDATE RenovationScope
       SET contractor_bid = ?, timeline_weeks = ?
       WHERE id = ?`
    )
    .bind(contractorBid, timelineWeeks, id)
    .run();
}

export async function updateAiRisk(
  db: D1Database,
  id: number,
  risk: string
) {
  await db
    .prepare(
      `UPDATE RenovationScope
       SET ai_risk_assessment = ?
       WHERE id = ?`
    )
    .bind(risk, id)
    .run();
}
