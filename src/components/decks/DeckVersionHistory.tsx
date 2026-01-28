/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  History,
  Clock,
  Sparkles,
  Eye,
  RotateCcw,
  FileText,
  Loader2,
  RefreshCw,
  File,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface DeckVersion {
  id: string;
  deck_id: string;
  version_number: number;
  html_output: string;
  refinement_prompt: string | null;
  changes_summary: string | null;
  version_type: 'original' | 'refined' | 'regenerated';
  created_at: string;
}

interface DeckVersionHistoryProps {
  deckId: string;
  currentVersion: number;
  onVersionRestore?: (versionNumber: number) => void;
  onVersionView?: (version: DeckVersion) => void;
  trigger?: React.ReactNode; // Custom trigger button
}

export function DeckVersionHistory({
  deckId,
  currentVersion,
  onVersionRestore,
  onVersionView,
  trigger,
}: DeckVersionHistoryProps) {
  const [versions, setVersions] = useState<DeckVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  // Fetch versions when sheet opens
  const fetchVersions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("j_hub_deck_versions")
        .select("*")
        .eq("deck_id", deckId)
        .order("version_number", { ascending: false });

      if (error) throw error;

      setVersions(data || []);
    } catch (error: any) {
      console.error("Error fetching versions:", error);
      toast.error("Erro ao carregar histórico de versões");
    } finally {
      setLoading(false);
    }
  };

  // Restore version (set as current)
  const handleRestore = async (versionNumber: number) => {
    try {
      setRestoringVersion(versionNumber);

      // Get version HTML
      const version = versions.find((v) => v.version_number === versionNumber);
      if (!version) {
        throw new Error("Versão não encontrada");
      }

      // Update deck to use this version
      const { error } = await supabase
        .from("j_hub_decks")
        .update({
          current_version: versionNumber,
          html_output: version.html_output,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deckId);

      if (error) throw error;

      toast.success(`Versão ${versionNumber} restaurada com sucesso!`);

      // Callback to parent
      if (onVersionRestore) {
        onVersionRestore(versionNumber);
      }

      // Refresh versions
      await fetchVersions();
    } catch (error: any) {
      console.error("Error restoring version:", error);
      toast.error(`Erro ao restaurar versão: ${error.message}`);
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" onClick={fetchVersions}>
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </SheetTitle>
          <SheetDescription>
            Todas as versões deste deck. Você pode visualizar ou restaurar versões
            anteriores.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma versão encontrada</p>
            </div>
          ) : (
            versions.map((version, index) => (
              <div key={version.id}>
                <div className="p-4 border rounded-lg space-y-3">
                  {/* Version header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">
                        Versão {version.version_number}
                      </h4>
                      {version.version_number === currentVersion && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          ATUAL
                        </Badge>
                      )}
                      {/* Version type badge */}
                      {version.version_type === 'original' && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                          <File className="h-3 w-3 mr-1" />
                          Original
                        </Badge>
                      )}
                      {version.version_type === 'refined' && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Refinado
                        </Badge>
                      )}
                      {version.version_type === 'regenerated' && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerado
                        </Badge>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(
                        new Date(version.created_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}
                    </div>
                  </div>

                  {/* Changes summary */}
                  {version.changes_summary && (
                    <div className="text-sm">
                      <p className="font-medium text-muted-foreground mb-1">
                        Mudanças:
                      </p>
                      <p className="text-foreground">{version.changes_summary}</p>
                    </div>
                  )}

                  {/* Refinement prompt (what user asked for) */}
                  {version.refinement_prompt && (
                    <div className="text-sm bg-muted p-3 rounded-md">
                      <p className="font-medium text-muted-foreground mb-1">
                        Solicitação de refinamento:
                      </p>
                      <p className="text-foreground italic">
                        "{version.refinement_prompt}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {/* View version */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onVersionView) {
                          onVersionView(version);
                        } else {
                          toast.info("Preview de versões em desenvolvimento");
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>

                    {/* Restore version (only if not current) */}
                    {version.version_number !== currentVersion && (
                      <Button
                        variant="default"
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
                    )}
                  </div>
                </div>

                {/* Separator between versions (except last) */}
                {index < versions.length - 1 && <Separator className="my-4" />}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
