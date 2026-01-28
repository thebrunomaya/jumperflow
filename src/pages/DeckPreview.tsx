import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { ViewportWarning } from "@/components/decks/ViewportWarning";

interface Deck {
  id: string;
  title: string;
  html_output: string | null;
  file_url: string | null;
}

export default function DeckPreview() {
  const { deckId } = useParams<{ deckId: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeckAndUser = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!deckId) {
          throw new Error("ID do deck não fornecido");
        }

        // Fetch deck
        const { data, error: fetchError } = await supabase
          .from("j_hub_decks")
          .select("id, title, html_output, file_url")
          .eq("id", deckId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Deck não encontrado");

        setDeck(data);

        // Fetch user role for admin override
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: userData } = await supabase
            .from("j_hub_users")
            .select("role")
            .eq("id", user.id)
            .single();

          setUserRole(userData?.role || null);
        }
      } catch (err) {
        console.error("Error fetching deck:", err);
        setError(err.message || "Erro ao carregar deck");
      } finally {
        setLoading(false);
      }
    };

    fetchDeckAndUser();
  }, [deckId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Deck não encontrado"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render full-screen deck
  return (
    <div className="min-h-screen bg-black">
      {/* Viewport size validation */}
      <ViewportWarning showAdminOverride={userRole === "admin"} />

      {deck.html_output ? (
        <iframe
          srcDoc={deck.html_output}
          className="w-full h-screen"
          title={deck.title}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      ) : deck.file_url ? (
        <iframe
          src={deck.file_url}
          className="w-full h-screen"
          title={deck.title}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      ) : (
        <div className="flex items-center justify-center h-screen text-white">
          <Alert className="max-w-md">
            <AlertDescription>
              HTML do deck não disponível.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
