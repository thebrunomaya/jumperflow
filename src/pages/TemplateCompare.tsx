import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTemplateList } from "@/hooks/useTemplateList";
import { useTemplateRead } from "@/hooks/useTemplateRead";
import { DiffViewer } from "@/components/templates/DiffViewer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, FileCode } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";

export default function TemplateCompare() {
  const navigate = useNavigate();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { data: templates, isLoading: loadingList } = useTemplateList();

  const [templateA, setTemplateA] = useState<string>("");
  const [templateB, setTemplateB] = useState<string>("");

  // Check if user is admin
  const isAdmin = userRole === "admin";

  // Hooks must be called before any conditional returns
  const {
    data: contentA,
    isLoading: loadingA,
    error: errorA,
  } = useTemplateRead(templateA || undefined);
  const {
    data: contentB,
    isLoading: loadingB,
    error: errorB,
  } = useTemplateRead(templateB || undefined);

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Acesso negado", {
        description: "Apenas administradores podem acessar esta página",
      });
      navigate("/decks/templates");
    }
  }, [roleLoading, isAdmin, navigate]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const isComparing = templateA && templateB && contentA && contentB;
  const isLoading = loadingList || loadingA || loadingB;

  return (
    <div className="flex flex-col h-screen">
      {/* App Header */}
      <Header />

      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/decks/templates")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Comparar Templates</h1>
              <p className="text-sm text-muted-foreground">
                Visualize diferenças entre dois templates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selection */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-4 max-w-4xl">
          {/* Template A */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Template A
            </label>
            <Select value={templateA} onValueChange={setTemplateA}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o primeiro template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem
                    key={template.template_id}
                    value={template.template_id}
                    disabled={template.template_id === templateB}
                  >
                    {template.template_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template B */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Template B
            </label>
            <Select value={templateB} onValueChange={setTemplateB}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segundo template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem
                    key={template.template_id}
                    value={template.template_id}
                    disabled={template.template_id === templateA}
                  >
                    {template.template_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Carregando templates...
              </p>
            </div>
          </div>
        ) : errorA || errorB ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center">
              <FileCode className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Erro ao carregar template
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {errorA instanceof Error
                    ? errorA.message
                    : errorB instanceof Error
                    ? errorB.message
                    : "Erro desconhecido"}
                </p>
              </div>
            </div>
          </div>
        ) : !isComparing ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center">
              <FileCode className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Selecione dois templates
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Escolha dois templates acima para visualizar as diferenças
                </p>
              </div>
            </div>
          </div>
        ) : (
          <DiffViewer
            oldContent={contentA.html_content}
            newContent={contentB.html_content}
            oldLabel={templateA}
            newLabel={templateB}
          />
        )}
      </div>
    </div>
  );
}
