import type { BillingOrder } from "@orvex/types";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import {
  formatCents,
  formatLedgerDate,
  orderKindLabel,
  orderStatusLabel,
} from "@/components/billing/format";

export function OrderLedger({
  orders,
  error,
}: {
  orders: BillingOrder[] | null;
  error: string | null;
}) {
  if (error !== null) {
    return <ErrorPanel title="Unable to load orders" body={error} />;
  }
  if (orders === null) {
    return <LoadingPanel />;
  }
  if (orders.length === 0) {
    return (
      <EmptyPanel
        title="No orders on file"
        body="Checkout sessions and plan changes for this organization list here."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">Kind</th>
            <th className="px-3 py-2.5 font-medium">Amount</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-3 py-2.5">
                {formatLedgerDate(order.createdAt)}
              </td>
              <td className="px-3 py-2.5">{orderKindLabel(order.kind)}</td>
              <td className="px-3 py-2.5 font-mono text-xs">
                {formatCents(order.amountCents)}
              </td>
              <td className="px-3 py-2.5">{orderStatusLabel(order.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
