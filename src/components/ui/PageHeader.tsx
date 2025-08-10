import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, icon: Icon, actions, className, children }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row justify-between gap-4 md:items-center py-4 px-6 border-b", className)}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
