import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getRenovationScope } from "~/utils/db.server";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

const smartFlipItems = [
  "Ceiling Raise",
  "JADU Conversion",
  "Illegal Plumbing",
  "Lot Line Skylight",
  "Backyard Drainage",
  "Juliette Deck",
];

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;
  const scope = await getRenovationScope(env.DB);
  return { scope };
}

export default function Compare() {
  const { scope } = useLoaderData<typeof loader>();

  const scenario = useMemo(() => {
    const cardA = scope.filter((item) => smartFlipItems.includes(item.item_name));
    const cardB = scope;

    const sum = (items: typeof scope) =>
      items.reduce(
        (acc, item) => {
          const cost = item.contractor_bid ?? item.target_cost;
          return {
            cost: acc.cost + cost,
            value: acc.value + item.est_value_add,
          };
        },
        { cost: 0, value: 0 }
      );

    return { cardA: sum(cardA), cardB: sum(cardB) };
  }, [scope]);

  const cardANet = scenario.cardA.value - scenario.cardA.cost;
  const cardBNet = scenario.cardB.value - scenario.cardB.cost;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scenario Compare</h1>
        <p className="text-sm text-muted-foreground">
          Compare the smart flip against the dream house build-out.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card A · Smart Flip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Included items:</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {smartFlipItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 text-sm">
              <p>Total Cost: ${scenario.cardA.cost.toLocaleString()}</p>
              <p>Total Value: ${scenario.cardA.value.toLocaleString()}</p>
              <p className={cardANet >= 0 ? "text-emerald-400" : "text-red-400"}>
                Net Profit: ${cardANet.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Card B · Dream House</span>
              <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-200">
                ⚠️ Adds 12+ Months for Variance
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Included items: All</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>Total Cost: ${scenario.cardB.cost.toLocaleString()}</p>
              <p>Total Value: ${scenario.cardB.value.toLocaleString()}</p>
              <p className={cardBNet >= 0 ? "text-emerald-400" : "text-red-400"}>
                Net Profit: ${cardBNet.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
