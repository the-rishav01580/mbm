// src/components/student-profile/PaymentForm.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PaymentFormState, PaymentMethod, PaymentStatus } from "./types";

interface PaymentFormProps {
  formState: PaymentFormState;
  isEditing: boolean;
  isSaving: boolean;
  onChange: (update: Partial<PaymentFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({ formState, isEditing, isSaving, onChange, onSubmit, onCancel }: PaymentFormProps) => (
    <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
        <h4 className="font-semibold">{isEditing ? "Edit Payment" : "Record New Payment"}</h4>
        <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-1"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={formState.date} onChange={e => onChange({ date: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" placeholder="0.00" value={formState.amount} onChange={e => onChange({ amount: e.target.value })} /></div>
            <div className="space-y-1"><Label>Method</Label><Select value={formState.method} onValueChange={(v: PaymentMethod) => onChange({ method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={formState.status} onValueChange={(v: PaymentStatus) => onChange({ status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
        </div>
        <div className="space-y-1"><Label htmlFor="notes">Notes (Optional)</Label><Input id="notes" placeholder="e.g., Mess fee for October" value={formState.notes} onChange={e => onChange({ notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2">
            {isEditing && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
            <Button type="button" onClick={onSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Payment" : "Record Payment"}
            </Button>
        </div>
    </div>
);