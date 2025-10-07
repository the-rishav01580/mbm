import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PaymentMethod, PaymentStatus } from "./types";

export interface TimeframeOption {
  label: string;
  value: string;
}

interface PaymentFiltersProps {
  searchTerm: string;
  statusFilter: PaymentStatus | "all";
  methodFilter: PaymentMethod | "all";
  timeframeFilter: string;
  timeframeOptions: TimeframeOption[];
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: PaymentStatus | "all") => void;
  onMethodFilterChange: (value: PaymentMethod | "all") => void;
  onTimeframeFilterChange: (value: string) => void;
}

export function PaymentFilters({
  searchTerm,
  statusFilter,
  methodFilter,
  timeframeFilter,
  timeframeOptions,
  onSearchTermChange,
  onStatusFilterChange,
  onMethodFilterChange,
  onTimeframeFilterChange,
}: PaymentFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,_1fr)_180px_180px_180px]">
      <Input
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Search payments..."
        className="bg-white shadow-soft"
      />
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusFilterChange(value as PaymentStatus | "all")
        }
      >
        <SelectTrigger className="bg-white shadow-soft">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={methodFilter}
        onValueChange={(value) =>
          onMethodFilterChange(value as PaymentMethod | "all")
        }
      >
        <SelectTrigger className="bg-white shadow-soft">
          <SelectValue placeholder="All Methods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="Cash">Cash</SelectItem>
          <SelectItem value="Online">Online</SelectItem>
          <SelectItem value="Card">Card</SelectItem>
          <SelectItem value="UPI">UPI</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={timeframeFilter}
        onValueChange={(value) => onTimeframeFilterChange(value)}
      >
        <SelectTrigger className="bg-white shadow-soft">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeframeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
