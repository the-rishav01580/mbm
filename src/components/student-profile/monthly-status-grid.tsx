import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MonthStatus, MonthlyStatus } from "./types";

interface MonthlyStatusGridProps {
  months: MonthlyStatus[];
  onUpdateStatus: (month: string, status: MonthStatus) => void;
}

const statusStyles: Record<MonthStatus, string> = {
  pending:
    "border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200",
  paid:
    "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200",
  overdue:
    "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
};

const statusOrder: MonthStatus[] = ["pending", "paid", "overdue"];

export function MonthlyStatusGrid({ months, onUpdateStatus }: MonthlyStatusGridProps) {
  const handleCycleStatus = (month: MonthlyStatus) => {
    const currentIndex = statusOrder.indexOf(month.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    onUpdateStatus(month.month, nextStatus);
  };

  return (
    <Card className="border-transparent bg-white shadow-soft ring-1 ring-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Fee Status by Month
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tap a month to cycle through Pending → Paid → Overdue
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {months.map((month) => (
            <button
              type="button"
              key={month.month}
              onClick={() => handleCycleStatus(month)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${statusStyles[month.status]}`}
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500/80">
                {month.month}
              </div>
              <div className="mt-1 text-base font-semibold">
                {month.status}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
