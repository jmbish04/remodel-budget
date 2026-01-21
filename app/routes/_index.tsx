import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getRenovationScope, updateRenovationBid } from "~/utils/db.server";

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const scope = await getRenovationScope(env.DB);
  return { scope };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.env as Env;
  const formData = await request.formData();
  const entries = Array.from(formData.entries());

  for (const [key, value] of entries) {
    if (!key.startsWith("bid-")) continue;
    const id = Number(key.replace("bid-", ""));
    const bidValue = value ? Number(value) : null;
    const timelineValue = formData.get(`timeline-${id}`);
    const timeline = timelineValue ? Number(timelineValue) : null;
    await updateRenovationBid(env.DB, id, bidValue, timeline);
  }

  return { ok: true };
}

export default function ContractorBid() {
  const { scope } = useLoaderData<typeof loader>();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contractor Bid Form</h1>
        <p className="text-sm text-muted-foreground">
          Enter your bid and timeline. Target cost and value add are hidden.
        </p>
      </div>
      <Form method="post" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Critical Constraint</TableHead>
              <TableHead>Permit Type</TableHead>
              <TableHead>Regulatory Flags</TableHead>
              <TableHead>Contractor Bid</TableHead>
              <TableHead>Timeline (weeks)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scope.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.item_name}</TableCell>
                <TableCell className="font-semibold text-red-400">
                  {item.critical_constraint}
                </TableCell>
                <TableCell>{item.permit_type}</TableCell>
                <TableCell>{item.regulatory_flags}</TableCell>
                <TableCell>
                  <Input
                    name={`bid-${item.id}`}
                    defaultValue={item.contractor_bid ?? ""}
                    type="number"
                    min="0"
                    step="100"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    name={`timeline-${item.id}`}
                    defaultValue={item.timeline_weeks ?? ""}
                    type="number"
                    min="0"
                    step="1"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button type="submit">Submit Estimate</Button>
      </Form>
    </section>
  );
}
