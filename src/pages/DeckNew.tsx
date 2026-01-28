/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeckConfigForm } from "@/components/decks/DeckConfigForm";
import { useDeckGeneration } from "@/hooks/useDeckGeneration";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { JumperBackground } from "@/components/ui/jumper-background";
import { toast } from "sonner";

export default function DeckNew() {
  const navigate = useNavigate();
  const { generateDeck, isGenerating, progress } = useDeckGeneration();

  const [userRole, setUserRole] = useState<"admin" | "staff" | "client" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
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

        if (!userData || !userData.role) {
          throw new Error("Usuário sem role definido");
        }

        const role = userData.role as "admin" | "staff" | "client";
        setUserRole(role);

        // Check if user can create decks (only admin/staff)
        if (role !== "admin" && role !== "staff") {
          setError("Você não tem permissão para criar decks. Apenas administradores e staff podem criar decks.");
        }
      } catch (err) {
        console.error("Error checking permissions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [navigate]);

  const handleSubmit = async (values: any) => {
    try {
      // Call Edge Function to create deck (bypasses RLS)
      const { data, error: invokeError } = await supabase.functions.invoke('j_hub_deck_create', {
        body: {
          title: values.title,
          markdown_source: values.markdown_source,
          type: values.type,
          brand_identity: values.brand_identity,
          template_id: values.template_id,
          account_id: values.account_id || null,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Falha ao criar deck');
      }

      if (!data || !data.success || !data.deck_id) {
        throw new Error(data?.error || 'Resposta inválida do servidor');
      }

      toast.success('Deck criado!', {
        description: 'Redirecionando para o editor...',
        duration: 2000,
      });

      // Navigate to new 3-stage deck editor
      navigate(`/decks/editor/${data.deck_id}`);
    } catch (err) {
      console.error("Error creating deck:", err);
      toast.error('Erro ao criar deck', {
        description: err.message || 'Falha ao criar deck',
        duration: 5000,
      });
    }
  };

  const handleCancel = () => {
    navigate("/decks");
  };

  // Handle HTML upload (skip generation pipeline)
  const handleHtmlUpload = async (values: {
    title: string;
    account_id: string;
    type: "report" | "plan" | "pitch";
    brand_identity: "jumper" | "koko" | "general";
    html_content: string;
  }) => {
    try {
      // Call Edge Function to upload HTML deck directly
      const { data, error: invokeError } = await supabase.functions.invoke('j_hub_deck_upload_html', {
        body: {
          title: values.title,
          html_content: values.html_content,
          type: values.type,
          brand_identity: values.brand_identity,
          account_id: values.account_id || null,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Falha ao fazer upload do deck');
      }

      if (!data || !data.success || !data.deck_id) {
        throw new Error(data?.error || 'Resposta inválida do servidor');
      }

      toast.success('Deck enviado com sucesso!', {
        description: 'Redirecionando para o preview...',
        duration: 2000,
      });

      // Navigate to deck editor (will show preview since all stages are completed)
      navigate(`/decks/editor/${data.deck_id}`);
    } catch (err) {
      console.error("Error uploading HTML deck:", err);
      toast.error('Erro ao fazer upload', {
        description: err.message || 'Falha ao enviar deck HTML',
        duration: 5000,
      });
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

  // Error state (permission denied)
  if (error) {
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </main>
      </JumperBackground>
    );
  }

  // User doesn't have permission
  if (userRole !== "admin" && userRole !== "staff") {
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
              <AlertDescription>
                Você não tem permissão para criar decks. Apenas administradores e staff podem criar
                decks.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/decks")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Plus className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Criar Novo Deck</h1>
              <p className="text-muted-foreground">
                Preencha as informações para gerar uma apresentação personalizada
              </p>
            </div>
          </div>

          {/* Progress indicator (if generating) */}
          {isGenerating && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>Gerando deck... {progress}%</span>
                <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <DeckConfigForm
            onSubmit={handleSubmit}
            onHtmlUpload={handleHtmlUpload}
            onCancel={handleCancel}
            isSubmitting={isGenerating}
          />
        </div>
      </main>
    </JumperBackground>
  );
}
