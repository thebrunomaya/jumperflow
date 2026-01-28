/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Upload,
  Calendar,
  User,
  Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubmissionRow {
  id: string;
  client: string | null;
  manager_id: string | null;
  status: string;
  error: string | null;
  created_at: string;
  updated_at?: string;
  client_name?: string | null;
  creative_name?: string | null;
  manager_name?: string | null;
  payload?: any;
  files?: any[];
}

interface CreativeCardProps {
  submission: SubmissionRow;
  isSelected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
  onViewDetails: (submission: SubmissionRow) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  isPublishing: boolean;
  isDeleting: boolean;
}

const statusConfig = {
  draft: { 
    label: "Rascunho", 
    variant: "outline" as const,
    color: "text-slate-600 bg-slate-50 border-slate-200"
  },
  pending: { 
    label: "Pendente", 
    variant: "secondary" as const,
    color: "text-[#FA4721] bg-orange-50 border-orange-200"
  },
  queued: { 
    label: "Na Fila", 
    variant: "secondary" as const,
    color: "text-[#FA4721] bg-orange-50 border-orange-200"
  },
  processing: { 
    label: "Processando", 
    variant: "secondary" as const,
    color: "text-[#FA4721] bg-orange-50 border-orange-200 animate-pulse"
  },
  processed: { 
    label: "Publicado", 
    variant: "default" as const,
    color: "text-green-600 bg-green-50 border-green-200"
  },
  error: { 
    label: "Erro", 
    variant: "destructive" as const,
    color: "text-red-600 bg-red-50 border-red-200"
  },
};

export const CreativeCard: React.FC<CreativeCardProps> = ({
  submission,
  isSelected,
  onSelectionChange,
  onViewDetails,
  onPublish,
  onDelete,
  isPublishing,
  isDeleting
}) => {
  const statusInfo = statusConfig[submission.status as keyof typeof statusConfig] || 
    { label: submission.status, variant: "outline" as const, color: "text-slate-600 bg-slate-50" };
  
  const creativeName = submission.creative_name || "Sem nome";
  const clientName = submission.client_name || submission.client || "—";
  const managerName = submission.manager_name || "—";
  
  const createdAt = new Date(submission.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { 
    addSuffix: true, 
    locale: ptBR 
  });

  const canEdit = ["draft", "error", "pending", "queued", "processing"].includes(submission.status);
  const canPublish = ["pending", "queued", "error"].includes(submission.status);
  const canDelete = ["draft", "error", "pending", "queued", "processing"].includes(submission.status);
  const canSelect = canPublish;

  const handleDeleteConfirm = () => {
    if (window.confirm(`Tem certeza que deseja excluir "${creativeName}"?`)) {
      onDelete(submission.id);
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-primary shadow-md' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox for bulk selection */}
          {canSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(submission.id, !!checked)}
              className="mt-1"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {/* Header with title and status */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate text-lg" title={creativeName}>
                  {creativeName}
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  ID: {submission.id}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={statusInfo.variant}
                  className={statusInfo.color}
                >
                  {statusInfo.label}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewDetails(submission)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    
                    {canEdit && (
                      <DropdownMenuItem asChild>
                        <Link to={`/create/${submission.id}`} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {canPublish && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onPublish(submission.id)}
                          disabled={isPublishing}
                          className="text-[#FA4721]"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {isPublishing ? "Publicando..." : "Publicar"}
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleDeleteConfirm}
                          disabled={isDeleting}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? "Excluindo..." : "Excluir"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate max-w-[150px]" title={clientName}>
                    {clientName}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[120px]" title={managerName}>
                    {managerName}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
            
            {/* Primary Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(submission)}
                className="flex-1 sm:flex-none"
              >
                <Eye className="mr-1 h-3 w-3" />
                Detalhes
              </Button>
              
              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/create/${submission.id}`}>
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Link>
                </Button>
              )}
              
              {canPublish && (
                <Button
                  size="sm"
                  onClick={() => onPublish(submission.id)}
                  disabled={isPublishing}
                  className="bg-[#FA4721] hover:bg-[#FA4721]/90 text-white"
                >
                  <Upload className="mr-1 h-3 w-3" />
                  {isPublishing ? "Publicando..." : "Publicar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};