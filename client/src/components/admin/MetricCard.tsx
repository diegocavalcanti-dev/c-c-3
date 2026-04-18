import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "red" | "purple";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  description?: string;
}

const colorClasses = {
  blue: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
  green: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
  orange: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
  red: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400",
  purple: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
};

export default function MetricCard({
  title,
  value,
  icon,
  color,
  trend,
  description,
}: MetricCardProps) {
  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-xs opacity-60 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium">
              {trend.direction === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value}% vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}
