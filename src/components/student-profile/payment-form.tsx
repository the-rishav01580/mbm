import { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { PaymentMethod, PaymentStatus } from "./types";

export interface PaymentFormState {
  id?: string;
  date: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  notes: string;
}

interface PaymentFormProps {
  formState: PaymentFormState;
  isEditing: boolean;
  onChange: (update: Partial<PaymentFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PaymentForm({
  formState,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Card className="border-transparent bg-white shadow-soft ring-1 ring-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          {isEditing ? "Update Payment" : "Record Payment"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-date">Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={formState.date}
              onChange={(event) => onChange({ date: event.target.value })}
              required
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="100"
              value={formState.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
              placeholder="₹"
              required
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-method">Method</Label>
            <Select
              value={formState.method}
              onValueChange={(value) =>
                onChange({ method: value as PaymentMethod })
              }
            >
              <SelectTrigger id="payment-method" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-status">Status</Label>
            <Select
              value={formState.status}
              onValueChange={(value) =>
                onChange({ status: value as PaymentStatus })
              }
            >
              <SelectTrigger id="payment-status" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea
              id="payment-notes"
              value={formState.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="Optional notes about this payment"
              className="bg-white"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" className="bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              {isEditing ? "Save Changes" : "Record Payment"}
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-700"
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
