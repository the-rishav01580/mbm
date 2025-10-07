// src/components/student-profile/SummaryCards.tsx

import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  label: string;
  value: string;
  tone?: 'success' | 'danger';
}

export const SummaryCards = ({ cards }: { cards: SummaryCardProps[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {cards.map(({ label, value, tone }) => (
      <Card key={label}>
        <CardContent className="pt-4">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className={`text-2xl font-bold ${tone === 'success' ? 'text-green-600' : tone === 'danger' ? 'text-destructive' : ''}`}>
            {value}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);