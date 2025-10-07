import { Card, CardContent } from "@/components/ui/card";

const toneValueClasses = {
  neutral: "text-slate-900",
  success: "text-emerald-600",
  danger: "text-rose-600",
} as const;

interface SummaryCardData {
  label: string;
  value: string;
  accent?: string;
  description?: string;
  tone?: keyof typeof toneValueClasses;
}

interface SummaryCardsProps {
  cards: SummaryCardData[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const toneClass = toneValueClasses[card.tone ?? "neutral"];
        return (
          <Card
            key={card.label}
            className="border-transparent bg-white shadow-soft ring-1 ring-slate-100"
          >
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <div className={`text-2xl font-semibold ${toneClass}`}>
                <span>{card.value}</span>
                {card.accent ? (
                  <span className="ml-2 text-base font-medium text-emerald-600">
                    {card.accent}
                  </span>
                ) : null}
              </div>
              {card.description ? (
                <p className="text-xs text-muted-foreground/80">
                  {card.description}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
