// src/components/student-profile/PaymentTable.tsx

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { PaymentTransaction } from "./types";

interface PaymentTableProps {
  transactions: PaymentTransaction[];
  onEdit: (transaction: PaymentTransaction) => void;
  onDelete: (id: string) => void;
  formatAmount: (amount: number) => string;
}

export const PaymentTable = ({ transactions, onEdit, onDelete, formatAmount }: PaymentTableProps) => (
  <div className="border rounded-lg overflow-hidden bg-background">
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        <tr>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Amount</th>
          <th className="p-3 text-left">Method</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ? (
          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payment history found.</td></tr>
        ) : (
          transactions.map(t => (
            <tr key={t.id} className="border-t">
              <td className="p-3">{format(new Date(t.payment_date), 'dd MMM, yyyy')}</td>
              <td className="p-3 font-medium">{formatAmount(t.amount)}</td>
              <td className="p-3">{t.method}</td>
              <td className="p-3"><Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{t.status}</Badge></td>
              <td className="p-3 text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(t)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);