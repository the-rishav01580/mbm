import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeesCalculatorProps {
  formatAmount: (value: number) => string;
}

export function FeesCalculator({ formatAmount }: FeesCalculatorProps) {
  const [monthlyFees, setMonthlyFees] = useState(3000);
  const [absentDays, setAbsentDays] = useState(0);

  const { payableAmount, dailyRate } = useMemo(() => {
    const rate = monthlyFees > 0 ? monthlyFees / 30 : 0;
    const deduction = rate * absentDays;
    return {
      payableAmount: Math.max(monthlyFees - deduction, 0),
      dailyRate: rate,
    };
  }, [monthlyFees, absentDays]);

  return (
    <Card className="border-transparent bg-white shadow-soft ring-1 ring-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Fees Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="monthly-fees">Monthly Fees</Label>
          <Input
            id="monthly-fees"
            type="number"
            min="0"
            step="100"
            value={monthlyFees}
            onChange={(event) => setMonthlyFees(Number(event.target.value) || 0)}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="absent-days">Number of Absent Days</Label>
          <Input
            id="absent-days"
            type="number"
            min="0"
            max={31}
            value={absentDays}
            onChange={(event) => setAbsentDays(Number(event.target.value) || 0)}
            className="bg-white"
          />
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="flex items-center justify-between">
            <span>Daily Rate</span>
            <span className="font-semibold text-slate-900">
              {formatAmount(dailyRate)}
            </span>
          </p>
          <p className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total Amount</span>
            <span>{formatAmount(payableAmount)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
