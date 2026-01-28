 
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DeckShareModal } from "@/components/decks/DeckShareModal";
import { DeckVersionHistory } from "@/components/decks/DeckVersionHistory";
import { DeckRefineModal } from "@/components/decks/DeckRefineModal";
import { MarkdownEditor } from "@/components/decks/MarkdownEditor";
import {
  ArrowLeft,
  Share2,
  Download,
  Trash2,
  RefreshCw,
  Maximize2,
  Building2,
  Calendar,
  FileText,
  History,
  Sparkles,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import { JumperBackground } from "@/components/ui/jumper-background";

interface Deck {
  id: string;
  user_id: string;
  account_id: string | null;
  title: string;
  type: "report" | "plan" | "pitch";
  brand_identity: "jumper" | "koko";
  template_id: string;
  markdown_source: string; // NEW: Original markdown input
  file_url: string | null;
  html_output: string | null;
  slug: string | null;
  is_public: boolean;
  current_version: number; // Version currently displayed (v1, v2, v3, ...)
  is_refined: boolean; // TRUE if deck has been refined (has versions > 1)
  created_at: string;
  updated_at: string;
}

export default function DeckEditor() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "staff" | "client" | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch user role
        const { data: userData, error: userError } = await supabase
          .from("j_hub_users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        const role = userData.role as "admin" | "staff" | "client";
        setUserRole(role);

        // Fetch deck
        const { data: deckData, error: deckError } = await supabase
          .from("j_hub_decks")
          .select("*")
          .eq("id", deckId!)
          .single();

        if (deckError) throw deckError;
        if (!deckData) throw new Error("Deck não encontrado");

        setDeck(deckData);

        // Check edit permissions (staff can edit all, clients only their own)
        const canUserEdit =
          role === "admin" || role === "staff" || deckData.user_id === user.id;
        setCanEdit(canUserEdit);
      } catch (err) {
        console.error("Error fetching deck:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (deckId) {
      fetchDeck();
    }
  }, [deckId, navigate]);

  const handleDelete = async () => {
    if (!deck) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este deck? Esta ação não pode ser desfeita."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("j_hub_decks").delete().eq("id", deck.id);

      if (error) throw error;

      toast.success("Deck excluído com sucesso!");
      navigate("/decks");
    } catch (err) {
      console.error("Error deleting deck:", err);
      toast.error("Erro ao excluir deck", {
        description: err.message,
      });
    }
  };

  const handleDownload = () => {
    if (!deck || !deck.file_url) {
      toast.error("URL do deck não disponível");
      return;
    }

    window.open(deck.file_url, "_blank");
  };

  const handleFullScreen = () => {
    if (!deck) return;

    window.open(`/decks/${deck.id}/preview`, "_blank");
  };

  const handleRegenerate = async (newMarkdown: string) => {
    if (!deck) return;

    try {
      toast.info("Atualizando markdown e regenerando deck...");

      // First update markdown in database
      const { error: updateError } = await supabase
        .from("j_hub_decks")
        .update({ markdown_source: newMarkdown })
        .eq("id", deck.id);

      if (updateError) throw updateError;

      // Then call Edge Function j_hub_deck_generate to regenerate
      const { data, error } = await supabase.functions.invoke("j_hub_deck_generate", {
        body: {
          deck_id: deck.id,
        },
      });

      if (error) throw error;

      // Reload page to show regenerated deck
      window.location.reload();
    } catch (err) {
      console.error("Error regenerating deck:", err);
      throw new Error(err.message || "Falha ao regenerar deck");
    }
  };

  // Loading state
  if (loading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </JumperBackground>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/decks")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>

            <Alert variant="destructive">
              <AlertDescription>{error || "Deck não encontrado"}</AlertDescription>
            </Alert>
          </div>
        </main>
      </JumperBackground>
    );
  }

  const typeLabels = {
    report: "Relatório",
    plan: "Planejamento",
    pitch: "Pitch",
  };

  const identityColors = {
    jumper: "bg-orange-100 text-orange-700 border-orange-300",
    koko: "bg-purple-100 text-purple-700 border-purple-300",
  };

  return (
    <JumperBackground overlay={false}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/decks")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleFullScreen}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Ver em Tela Cheia
              </Button>

              {/* Version History */}
              <DeckVersionHistory
                deckId={deck.id}
                currentVersion={deck.current_version || 1}
                onVersionRestore={(versionNumber) => {
                  // Refresh deck after restore
                  window.location.reload();
                }}
                trigger={
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    Histórico
                  </Button>
                }
              />

              {/* AI Refinement (only for editors) */}
              {canEdit && (
                <DeckRefineModal
                  deckId={deck.id}
                  currentVersion={deck.current_version || 1}
                  onRefineComplete={(newVersion, changesSummary) => {
                    // Refresh deck after refinement
                    toast.success(`Versão ${newVersion} criada com sucesso!`);
                    window.location.reload();
                  }}
                  trigger={
                    <Button variant="default">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Refinar com IA
                    </Button>
                  }
                />
              )}

              <Button variant="outline" onClick={() => setShareModalOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>

              {canEdit && (
                <>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>

                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Deck info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{deck.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(deck.created_at), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {deck.account_id && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Conta: {deck.account_id}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Template: {deck.template_id}</span>
                    </div>
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className={identityColors[deck.brand_identity]}>
                    {deck.brand_identity === "jumper" ? "Jumper" : "Koko"}
                  </Badge>

                  <Badge variant="outline">{typeLabels[deck.type]}</Badge>

                  {deck.is_public && (
                    <Badge variant="outline">
                      {deck.slug ? "Público" : "Compartilhado"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="markdown" className="gap-2" disabled={!canEdit}>
                    <FileText className="h-4 w-4" />
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger value="versions" className="gap-2">
                    <History className="h-4 w-4" />
                    Versões
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Preview */}
                <TabsContent value="preview" className="space-y-4 mt-6">
                  {deck.html_output ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Preview da apresentação
                      </p>

                      <div className="border rounded-lg overflow-hidden bg-muted">
                        <iframe
                          srcDoc={deck.html_output}
                          className="w-full h-[600px]"
                          title={`Preview: ${deck.title}`}
                          sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                      </div>
                    </div>
                  ) : deck.file_url ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Preview da apresentação (fallback)
                      </p>

                      <div className="border rounded-lg overflow-hidden bg-muted">
                        <iframe
                          src={deck.file_url}
                          className="w-full h-[600px]"
                          title={`Preview: ${deck.title}`}
                          sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        HTML não disponível. O deck pode ainda estar sendo processado.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Tab: Markdown */}
                <TabsContent value="markdown" className="space-y-4 mt-6">
                  {canEdit ? (
                    <MarkdownEditor
                      deckId={deck.id}
                      initialMarkdown={deck.markdown_source}
                      onRegenerate={handleRegenerate}
                    />
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Você não tem permissão para editar este deck.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Tab: Versions */}
                <TabsContent value="versions" className="space-y-4 mt-6">
                  <DeckVersionHistory
                    deckId={deck.id}
                    currentVersion={deck.current_version || 1}
                    onVersionRestore={(versionNumber) => {
                      // Refresh deck after restore
                      toast.success(`Versão ${versionNumber} restaurada com sucesso!`);
                      window.location.reload();
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Share Modal */}
          <DeckShareModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            deckId={deck.id}
            deckTitle={deck.title}
            currentSlug={deck.slug}
            isPublic={deck.is_public}
          />
        </div>
      </main>
    </JumperBackground>
  );
}
