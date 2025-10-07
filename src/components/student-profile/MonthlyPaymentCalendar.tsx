// src/components/student-profile/MonthlyPaymentCalendar.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentTransaction } from "./types";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const MonthlyPaymentCalendar = ({ transactions }: { transactions: PaymentTransaction[] }) => {
  const [year, setYear] = useState(new Date().getFullYear());

  const monthlyStatuses = useMemo(() => {
    const paidMonths = new Set<number>();
    transactions.forEach(t => {
      if (t.status === 'completed') {
        const transactionDate = new Date(t.date);
        if (transactionDate.getFullYear() === year) {
          paidMonths.add(transactionDate.getMonth()); // 0 for January, 1 for February, etc.
        }
      }
    });

    return months.map((monthName, index) => ({
      name: monthName,
      status: paidMonths.has(index) ? 'paid' : 'pending'
    }));
  }, [transactions, year]);

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Monthly Status</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-semibold">{year}</span>
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {monthlyStatuses.map(({ name, status }) => (
          <div key={name} className={`p-2 rounded-lg text-center border ${status === 'paid' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-muted/50'}`}>
            <p className="font-medium text-sm">{name}</p>
            <Badge variant={status === 'paid' ? 'default' : 'secondary'} className={status === 'paid' ? 'bg-green-600' : ''}>{status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};