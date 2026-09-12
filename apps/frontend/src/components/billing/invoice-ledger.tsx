import type { BillingInvoice } from "@orvex/types";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/console/console-panel";
import {
  formatCents,
  formatLedgerDate,
  titleStatus,
} from "@/components/billing/format";

export function InvoiceLedger({
  invoices,
  error,
}: {
  invoices: BillingInvoice[] | null;
  error: string | null;
}) {
  if (error !== null) {
    return <ErrorPanel title="Unable to load invoices" body={error} />;
  }
  if (invoices === null) {
    return <LoadingPanel />;
  }
  if (invoices.length === 0) {
    return (
      <EmptyPanel
        title="No invoices yet."
        body="Receipts appear here after a paid checkout completes."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">Amount</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const receipt = invoice.hostedInvoiceUrl ?? invoice.invoicePdf;
            return (
              <tr
                key={invoice.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  {formatLedgerDate(invoice.createdAt)}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {formatCents(invoice.amountCents, invoice.currency)}
                </td>
                <td className="px-3 py-2.5">{titleStatus(invoice.status)}</td>
                <td className="px-3 py-2.5">
                  {receipt === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <a
                      className="text-foreground underline-offset-4 hover:underline"
                      href={receipt}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {invoice.number ?? "Open"}
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
