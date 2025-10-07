// src/components/student-profile/FeesCalculator.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

export const FeesCalculator = ({ formatAmount }: { formatAmount: (amount: number) => string }) => {
  const [monthlyFee, setMonthlyFee] = useState("3000");
  const [absentDays, setAbsentDays] = useState("0");

  const totalAmount = useMemo(() => {
    const fee = parseFloat(monthlyFee) || 0;
    const days = parseInt(absentDays) || 0;
    if (fee <= 0 || days < 0) return fee;
    const deductionPerDay = fee / 30;
    return Math.max(0, fee - (deductionPerDay * days));
  }, [monthlyFee, absentDays]);

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" /> Fees Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Monthly Fee</Label><Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} /></div>
        <div><Label>Absent Days</Label><Input type="number" value={absentDays} onChange={e => setAbsentDays(e.target.value)} /></div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Payable</span><strong className="text-lg">{formatAmount(totalAmount)}</strong></div>
        </div>
      </CardContent>
    </Card>
  );
};