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

/**
 * Fetches all renovation scope items.
 */
export async function getRenovationScope(db: D1Database): Promise<RenovationScope[]> {
  try {
    const { results } = await db
      .prepare(
        `SELECT id, item_name, category, critical_constraint, permit_type, regulatory_flags, target_cost, est_value_add, contractor_bid, timeline_weeks, ai_risk_assessment 
         FROM RenovationScope 
         ORDER BY id`
      )
      .all<RenovationScope>();
    
    return results ?? [];
  } catch (error: any) {
    console.error("Database Error (getRenovationScope):", error.message);
    // Rethrowing allows the UI/Caller to show a specific "Failed to load" message
    throw new Error("Could not retrieve renovation scope data.");
  }
}

/**
 * Updates bid and timeline for a specific item.
 */
export async function updateRenovationBid(
  db: D1Database,
  id: number,
  contractorBid: number | null,
  timelineWeeks: number | null
): Promise<void> {
  try {
    const result = await db
      .prepare(
        `UPDATE RenovationScope 
         SET contractor_bid = ?, timeline_weeks = ? 
         WHERE id = ?`
      )
      .bind(contractorBid, timelineWeeks, id)
      .run();

    if (!result.success) {
      throw new Error(`Update failed for ID ${id}`);
    }
  } catch (error: any) {
    console.error(`Database Error (updateRenovationBid) for ID ${id}:`, error.message);
    throw new Error("Failed to update contractor bid. Please try again.");
  }
}

/**
 * Updates the AI risk assessment text.
 */
export async function updateAiRisk(
  db: D1Database,
  id: number,
  risk: string
): Promise<void> {
  try {
    const result = await db
      .prepare(
        `UPDATE RenovationScope 
         SET ai_risk_assessment = ? 
         WHERE id = ?`
      )
      .bind(risk, id)
      .run();

    if (!result.success) {
      throw new Error(`AI Risk update failed for ID ${id}`);
    }
  } catch (error: any) {
    console.error(`Database Error (updateAiRisk) for ID ${id}:`, error.message);
    throw new Error("Failed to update AI risk assessment.");
  }
}
