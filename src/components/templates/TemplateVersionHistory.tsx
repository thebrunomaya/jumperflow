/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Eye,
  RotateCcw,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  html_content: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface TemplateVersionHistoryProps {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionRestore?: (htmlContent: string) => void;
}

export function TemplateVersionHistory({
  templateId,
  isOpen,
  onClose,
  onVersionRestore,
}: TemplateVersionHistoryProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  // Fetch versions when sheet opens
  const fetchVersions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "j_hub_template_versions",
        {
          body: { template_id: templateId },
        }
      );

      if (error) throw error;
      if (!data || !data.versions) {
        throw new Error("Resposta inválida da API");
      }

      setVersions(data.versions);
    } catch (error: any) {
      console.error("Error fetching versions:", error);
      toast.error("Erro ao carregar histórico de versões");
    } finally {
      setLoading(false);
    }
  };

  // Restore version
  const handleRestore = async (versionNumber: number) => {
    try {
      setRestoringVersion(versionNumber);

      // Get version HTML
      const version = versions.find((v) => v.version_number === versionNumber);
      if (!version) {
        throw new Error("Versão não encontrada");
      }

      // Call parent callback to restore
      if (onVersionRestore) {
        onVersionRestore(version.html_content);
      }

      toast.success("Versão restaurada!", {
        description: `Versão ${versionNumber} carregada no editor`,
      });

      onClose();
    } catch (error: any) {
      console.error("Error restoring version:", error);
      toast.error("Erro ao restaurar versão");
    } finally {
      setRestoringVersion(null);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      });
    } catch {
      return timestamp;
    }
  };

  // Open sheet handler
  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchVersions();
    } else {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Versões
          </SheetTitle>
          <SheetDescription>
            Versões salvas de <strong>{templateId}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma versão salva ainda</p>
              <p className="text-sm mt-2">
                Versões são criadas automaticamente ao salvar o template
              </p>
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">
                          v{version.version_number}
                        </Badge>
                      </div>

                      {version.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {version.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(version.created_at)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version.version_number)}
                        disabled={restoringVersion === version.version_number}
                      >
                        {restoringVersion === version.version_number ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Restaurando...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restaurar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && versions.length > 0 && (
            <>
              <Separator className="my-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchVersions}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Lista
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
