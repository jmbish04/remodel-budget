import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getRenovationScope, updateAiRisk } from "~/utils/db.server";

const PROMPT_PREFIX = 
  "Analyze this construction constraint for 126 Colby St (San Francisco). Flag high-risk timeline delays regarding Section 311 and Variance. Be concise.";

type ActionData = {
  analysis?: string;
  error?: string;
};

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  // Wrapped in try-catch in db.server.ts as previously discussed
  const scope = await getRenovationScope(env.DB);
  return { scope };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.env as Env;
  const formData = await request.formData();
  const selectedIds = formData.getAll("selected").map((id) => Number(id));

  if (selectedIds.length === 0) {
    return json<ActionData>({ error: "Select at least one row to analyze." }, { status: 400 });
  }

  const scope = await getRenovationScope(env.DB);
  const selectedItems = scope.filter((item) => selectedIds.includes(item.id));

  try {
    // We process each item individually to ensure the AI risk assessment 
    // is specific to that item's constraints.
    const results = await Promise.all(
      selectedItems.map(async (item) => {
        try {
          const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
            prompt: `${PROMPT_PREFIX}\n\nItem: ${item.item_name}\nConstraint: ${item.critical_constraint}\nPermit: ${item.permit_type}`,
            max_tokens: 150,
          });

          // Clean handling of AI response types
          let analysisText = "";
          if (typeof response === "string") {
            analysisText = response;
          } else if (response && "result" in response) {
            analysisText = String(response.result);
          } else {
            // Log full response for debugging, but save a clean error for user
            console.error("Unexpected AI Response Format:", JSON.stringify(response));
            analysisText = "Risk analysis temporarily unavailable for this item.";
          }

          // Update the specific row in the database
          await updateAiRisk(env.DB, item.id, analysisText);
          return analysisText;
        } catch (err) {
          console.error(`AI Task Failed for ID ${item.id}:`, err);
          return `Error analyzing ${item.item_name}.`;
        }
      })
    );

    // Return the combined analysis for the UI Dialog
    return json<ActionData>({ analysis: results.join("\n\n---\n\n") });
  } catch (globalError) {
    console.error("Action Function Critical Failure:", globalError);
    return json<ActionData>({ error: "A critical error occurred during analysis." }, { status: 500 });
  }
}

export default function OwnerDashboard() {
  const { scope } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const chartData = useMemo(
    () =>
      scope.map((item) => ({
        name: item.item_name,
        target: item.target_cost,
        bid: item.contractor_bid ?? 0,
      })),
    [scope]
  );

  // Fallback logic for the display modal
  const displayAnalysis = actionData?.analysis || actionData?.error;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Owner ROI Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track ROI, bids, and AI risk analysis for each renovation item.
        </p>
      </div>

      <Form method="post" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Renovation Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Constraint</TableHead>
                  <TableHead>Permit</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Value Add</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>ROI %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scope.map((item) => {
                  const bid = item.contractor_bid ?? 0;
                  const roi = bid ? (item.est_value_add - bid) / bid : 0;
                  const roiClass = roi > 1 ? "text-emerald-400" : roi < 0 ? "text-red-400" : "text-muted-foreground";
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          name="selected"
                          value={item.id}
                          className="h-4 w-4 rounded border-border bg-background text-primary"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.critical_constraint}>
                        {item.critical_constraint}
                      </TableCell>
                      <TableCell>{item.permit_type}</TableCell>
                      <TableCell>${item.target_cost.toLocaleString()}</TableCell>
                      <TableCell>${item.est_value_add.toLocaleString()}</TableCell>
                      <TableCell>{bid ? `$${bid.toLocaleString()}` : "-"}</TableCell>
                      <TableCell className={roiClass}>
                        {bid ? `${Math.round(roi * 100)}%` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Analyzing..." : "Analyze Selected Risks"}
          </Button>
          
          <Dialog open={Boolean(displayAnalysis) || isSubmitting}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{actionData?.error ? "Error" : "AI Risk Assessment"}</DialogTitle>
              </DialogHeader>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {isSubmitting ? "Generating architectural risk insights..." : displayAnalysis}
              </div>
            </DialogContent>
          </Dialog>
          <Badge variant="outline">Cloudflare Workers AI (Llama 3)</Badge>
        </div>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Target Cost vs. Actual Bid</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e2e8f0" }}
              />
              <Bar dataKey="target" fill="#64748b" radius={[6, 6, 0, 0]} name="Target Cost" />
              <Bar dataKey="bid" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Contractor Bid" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
