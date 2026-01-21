import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@cloudflare/workers-types";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
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

/**
 * Action Data Type for Type-Safe Errors
 */
type ActionData = {
  ok: boolean;
  errors?: Record<string, string>;
};

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const scope = await getRenovationScope(env.DB);
  return { scope };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.env as Env;
  const formData = await request.formData();
  const entries = Array.from(formData.entries());
  
  const errors: Record<string, string> = {};

  // 1. Collect and Validate All Entries
  for (const [key, value] of entries) {
    if (!key.startsWith("bid-")) continue;

    const id = Number(key.replace("bid-", ""));
    const rawBidValue = value?.toString();
    const rawTimelineValue = formData.get(`timeline-${id}`)?.toString();

    // Validate ID integrity
    if (isNaN(id)) continue;

    // Validate Bid (Range: 0 - 10,000,000)
    let bidValue: number | null = null;
    if (rawBidValue && rawBidValue.trim() !== "") {
      bidValue = Number(rawBidValue);
      if (isNaN(bidValue) || bidValue < 0) {
        errors[`bid-${id}`] = "Enter a valid positive number";
      } else if (bidValue > 10_000_000) {
        errors[`bid-${id}`] = "Bid exceeds maximum limit";
      }
    }

    // Validate Timeline (Range: 0 - 156 weeks [3 years])
    let timeline: number | null = null;
    if (rawTimelineValue && rawTimelineValue.trim() !== "") {
      timeline = Number(rawTimelineValue);
      if (isNaN(timeline) || timeline < 0) {
        errors[`timeline-${id}`] = "Invalid weeks";
      } else if (timeline > 156) {
        errors[`timeline-${id}`] = "Timeline too long (>3yrs)";
      }
    }

    // 2. Only proceed with database update if this specific row is valid
    if (!errors[`bid-${id}`] && !errors[`timeline-${id}`]) {
      try {
        await updateRenovationBid(env.DB, id, bidValue, timeline);
      } catch (e) {
        errors[`db-${id}`] = "Database connection error";
      }
    }
  }

  // 3. Return errors if any validations failed
  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ ok: false, errors }, { status: 400 });
  }

  return json<ActionData>({ ok: true });
}

export default function ContractorBid() {
  const { scope } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contractor Bid Form</h1>
        <p className="text-sm text-muted-foreground">
          Enter your bid and timeline. Updates are validated server-side for accuracy.
        </p>
      </div>

      <Form method="post" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Critical Constraint</TableHead>
              <TableHead>Permit Type</TableHead>
              <TableHead>Contractor Bid ($)</TableHead>
              <TableHead>Timeline (weeks)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scope.map((item) => {
              const bidError = actionData?.errors?.[`bid-${item.id}`];
              const timelineError = actionData?.errors?.[`timeline-${item.id}`];

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell className="text-red-400 text-xs italic">
                    {item.critical_constraint}
                  </TableCell>
                  <TableCell className="text-xs uppercase">{item.permit_type}</TableCell>
                  <TableCell>
                    <Input
                      name={`bid-${item.id}`}
                      defaultValue={item.contractor_bid ?? ""}
                      type="number"
                      className={bidError ? "border-destructive" : ""}
                    />
                    {bidError && (
                      <span className="text-[10px] text-destructive mt-1 block font-medium">
                        {bidError}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      name={`timeline-${item.id}`}
                      defaultValue={item.timeline_weeks ?? ""}
                      type="number"
                      className={timelineError ? "border-destructive" : ""}
                    />
                    {timelineError && (
                      <span className="text-[10px] text-destructive mt-1 block font-medium">
                        {timelineError}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex justify-end gap-4 items-center">
          {actionData?.ok && !isSubmitting && (
            <p className="text-sm text-emerald-500 font-medium">Changes saved successfully!</p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Submit Estimates"}
          </Button>
        </div>
      </Form>
    </section>
  );
}
