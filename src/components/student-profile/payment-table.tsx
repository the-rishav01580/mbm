import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { PaymentTransaction } from "./types";

interface PaymentTableProps {
  transactions: PaymentTransaction[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean, ids: string[]) => void;
  onEdit: (transaction: PaymentTransaction) => void;
  onDelete: (id: string) => void;
  formatAmount: (amount: number) => string;
}

const statusClasses: Record<PaymentTransaction["status"], string> = {
  completed:
    "border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-950/20 dark:text-emerald-300",
  pending:
    "border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/60 dark:bg-amber-950/20 dark:text-amber-300",
};

export function PaymentTable({
  transactions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  formatAmount,
}: PaymentTableProps) {
  const allIds = useMemo(() => transactions.map((transaction) => transaction.id), [transactions]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  return (
    <Card className="border-transparent bg-white shadow-soft ring-1 ring-slate-100">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-auto">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    checked={allSelected}
                    onChange={(event) =>
                      onToggleSelectAll(event.target.checked, allIds)
                    }
                    aria-label="Select all rows"
                  />
                </th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No payments found for the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const isSelected = selectedIds.has(transaction.id);
                  const formattedDate = format(
                    parseISO(transaction.date),
                    "d/M/yyyy",
                  );
                  return (
                    <tr key={transaction.id} className="bg-white hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={isSelected}
                          onChange={() => onToggleSelect(transaction.id)}
                          aria-label={`Select payment on ${formattedDate}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formattedDate}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatAmount(transaction.amount)}
                      </td>
                      <td className="px-4 py-3">{transaction.method}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusClasses[transaction.status]}>
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-primary/40 hover:text-primary"
                            onClick={() => onEdit(transaction)}
                            aria-label="Edit payment"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-destructive/30 hover:text-destructive"
                            onClick={() => onDelete(transaction.id)}
                            aria-label="Delete payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
