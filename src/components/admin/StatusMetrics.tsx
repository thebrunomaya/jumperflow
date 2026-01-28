import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Archive
} from "lucide-react";

interface StatusMetricsProps {
  items: any[];
  onStatusFilter: (status: string | null) => void;
  activeFilter: string | null;
}

const statusConfig = {
  draft: {
    label: "Rascunhos",
    icon: FileText,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30 hover:bg-muted/40 backdrop-blur-sm",
    borderColor: "border-border/50"
  },
  pending: {
    label: "Pendentes",
    icon: Clock,
    color: "text-[#FA4721]",
    bgColor: "bg-[#FA4721]/5 hover:bg-[#FA4721]/10 backdrop-blur-sm",
    borderColor: "border-[#FA4721]/20"
  },
  queued: {
    label: "Na Fila",
    icon: Archive,
    color: "text-[#FA4721]",
    bgColor: "bg-[#FA4721]/5 hover:bg-[#FA4721]/10 backdrop-blur-sm",
    borderColor: "border-[#FA4721]/20"
  },
  processing: {
    label: "Processando",
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/5 hover:bg-blue-500/10 backdrop-blur-sm",
    borderColor: "border-blue-500/20"
  },
  processed: {
    label: "Publicados",
    icon: CheckCircle,
    color: "text-[#2AA876]",
    bgColor: "bg-[#2AA876]/5 hover:bg-[#2AA876]/10 backdrop-blur-sm",
    borderColor: "border-[#2AA876]/20"
  },
  error: {
    label: "Erros",
    icon: AlertCircle,
    color: "text-[#F04438]",
    bgColor: "bg-[#F04438]/5 hover:bg-[#F04438]/10 backdrop-blur-sm",
    borderColor: "border-[#F04438]/20"
  },
};

export const StatusMetrics: React.FC<StatusMetricsProps> = ({ 
  items, 
  onStatusFilter, 
  activeFilter 
}) => {
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize all status counts
    Object.keys(statusConfig).forEach(status => {
      counts[status] = 0;
    });
    
    // Count actual statuses
    items.forEach(item => {
      if (Object.prototype.hasOwnProperty.call(counts, item.status)) {
        counts[item.status]++;
      }
    });
    
    return counts;
  }, [items]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {Object.entries(statusConfig).map(([status, config]) => {
        const Icon = config.icon;
        const count = statusCounts[status];
        const isActive = activeFilter === status;
        
        return (
          <Card 
            key={status}
            className={`cursor-pointer transition-all duration-200 ${config.bgColor} ${config.borderColor} ${
              isActive ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'
            }`}
            onClick={() => onStatusFilter(isActive ? null : status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon
                    className={`h-4 w-4 ${config.color}`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {config.label}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${config.color} border-current`}
                >
                  {count}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};