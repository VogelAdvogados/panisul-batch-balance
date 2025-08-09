import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Item {
  id: string;
  name: string;
  value: string | number;
  linkTo: string;
}

interface TopItemsListProps {
  items: Item[];
  title: string;
  isLoading: boolean;
  valueFormatter?: (value: number) => string;
}

export const TopItemsList = ({ items, title, isLoading, valueFormatter }: TopItemsListProps) => {
  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ));
    }

    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>;
    }

    return items.map((item, index) => (
      <div key={item.id} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</div>
          <Link to={item.linkTo} className="text-sm font-medium hover:underline truncate">
            {item.name}
          </Link>
        </div>
        <div className="text-sm font-semibold">
          {typeof item.value === 'number' && valueFormatter
            ? valueFormatter(item.value)
            : item.value}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      {renderContent()}
    </div>
  );
};
