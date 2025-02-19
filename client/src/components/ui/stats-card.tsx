import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stat {
  label: string;
  value: string;
}

interface StatsCardProps {
  title: string;
  icon?: React.ReactNode;
  stats: Stat[];
}

export default function StatsCard({ title, icon, stats }: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-medium">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
