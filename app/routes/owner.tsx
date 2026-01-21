import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
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

const promptText =
  "Analyze these construction constraints for 126 Colby St (San Francisco). Flag high-risk timeline delays specifically regarding Section 311 and Variance.";

type ActionData = {
  analysis?: string;
};

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const scope = await getRenovationScope(env.DB);
  return { scope };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.env as Env;
  const formData = await request.formData();
  const selectedIds = formData.getAll("selected").map((id) => Number(id));
  const scope = await getRenovationScope(env.DB);
  const selected = scope.filter((item) => selectedIds.includes(item.id));

  if (selected.length === 0) {
    return { analysis: "Select at least one row to analyze." };
  }

  const combined = selected
    .map(
      (item) =>
        `Item: ${item.item_name}\nCritical Constraint: ${item.critical_constraint}\nPermit Type: ${item.permit_type}`
    )
    .join("\n\n");

  const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    prompt: `${promptText}\n\n${combined}`,
    max_tokens: 256,
  });

  const analysisText =
    typeof response === "string"
      ? response
      : "result" in response
        ? String(response.result)
        : JSON.stringify(response);

  await Promise.all(
    selected.map((item) => updateAiRisk(env.DB, item.id, analysisText))
  );

  return { analysis: analysisText } satisfies ActionData;
}

export default function OwnerDashboard() {
  const { scope } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  const chartData = useMemo(
    () =>
      scope.map((item) => ({
        name: item.item_name,
        target: item.target_cost,
        bid: item.contractor_bid ?? 0,
      })),
    [scope]
  );

  const lastAnalysis =
    actionData?.analysis ??
    scope.find((item) => item.ai_risk_assessment)?.ai_risk_assessment;

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
                  <TableHead>Flags</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Value Add</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>ROI %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scope.map((item) => {
                  const bid = item.contractor_bid ?? 0;
                  const roi = bid ? (item.est_value_add - bid) / bid : 0;
                  const roiClass =
                    roi > 1
                      ? "text-emerald-400"
                      : roi < 0
                        ? "text-red-400"
                        : "text-muted-foreground";
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
                      <TableCell>{item.critical_constraint}</TableCell>
                      <TableCell>{item.permit_type}</TableCell>
                      <TableCell>{item.regulatory_flags}</TableCell>
                      <TableCell>${item.target_cost.toLocaleString()}</TableCell>
                      <TableCell>${item.est_value_add.toLocaleString()}</TableCell>
                      <TableCell>
                        {item.contractor_bid ? `$${item.contractor_bid.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        {item.timeline_weeks ? `${item.timeline_weeks} wks` : "-"}
                      </TableCell>
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
          <Button type="submit" disabled={navigation.state === "submitting"}>
            Analyze Risks
          </Button>
          <Dialog open={Boolean(actionData?.analysis) || navigation.state === "submitting"}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Risk Assessment</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {navigation.state === "submitting"
                  ? "Analyzing selected items..."
                  : lastAnalysis ?? "Run analysis to see risk insights."}
              </p>
            </DialogContent>
          </Dialog>
          <Badge>ROI insights updated</Badge>
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
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="target" fill="#64748b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="bid" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
