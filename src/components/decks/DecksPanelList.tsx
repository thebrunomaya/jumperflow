 
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMyDecks } from "@/hooks/useMyDecks";
import { useMyNotionAccounts } from "@/hooks/useMyNotionAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { DeckCard } from "./DeckCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrioritizedAccountSelect } from "@/components/shared/PrioritizedAccountSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Filter, SlidersHorizontal, Presentation, X, FileCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DecksPanelListProps {
  userRole: "admin" | "staff" | "client";
}

export function DecksPanelList({ userRole }: DecksPanelListProps) {
  const navigate = useNavigate();
  const { decks, loading, error, refetch } = useMyDecks();
  const { accounts, loading: accountsLoading } = useMyNotionAccounts();
  const { userRole: currentUserRole } = useUserRole();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [identityFilter, setIdentityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");

  const canCreate = userRole === "admin" || userRole === "staff";

  // Filtered and sorted decks
  const filteredDecks = useMemo(() => {
    let result = [...decks];

    // Account filter
    if (selectedAccountId) {
      result = result.filter((deck) => deck.account_id === selectedAccountId);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (deck) =>
          deck.title.toLowerCase().includes(query) ||
          deck.account_name?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((deck) => deck.type === typeFilter);
    }

    // Identity filter
    if (identityFilter !== "all") {
      result = result.filter((deck) => deck.brand_identity === identityFilter);
    }

    // Sort
    if (sortBy === "date") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [decks, selectedAccountId, searchQuery, typeFilter, identityFilter, sortBy]);

  const handleEdit = (deckId: string) => {
    navigate(`/decks/editor/${deckId}`);
  };

  const handleShare = (deckId: string) => {
    // TODO: Open share modal
    toast.info("Funcionalidade de compartilhamento em breve!");
  };

  const handleDelete = async (deckId: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este deck? Esta ação não pode ser desfeita."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("j_hub_decks").delete().eq("id", deckId);

      if (error) throw error;

      toast.success("Deck excluído com sucesso!");
      refetch();
    } catch (err) {
      console.error("Error deleting deck:", err);
      toast.error("Erro ao excluir deck", {
        description: err.message,
      });
    }
  };

  const handleClearFilter = () => {
    setSelectedAccountId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar decks: {error}
          <Button variant="outline" size="sm" onClick={refetch} className="ml-4">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Presentation className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Decks</h1>
            <p className="text-muted-foreground">
              {filteredDecks.length} {filteredDecks.length === 1 ? "deck" : "decks"}
              {searchQuery || typeFilter !== "all" || identityFilter !== "all"
                ? " encontrados"
                : " no total"}
            </p>
          </div>
        </div>

        {canCreate && (
          <div className="flex gap-2">
            {userRole === "admin" && (
              <Button
                onClick={() => navigate("/decks/templates")}
                variant="outline"
                size="lg"
              >
                <FileCode className="mr-2 h-5 w-5" />
                Gerenciar Templates
              </Button>
            )}
            <Button onClick={() => navigate("/decks/new")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Deck
            </Button>
          </div>
        )}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-4">
        {/* Account filter */}
        {accounts.length > 1 && (
          <div className="flex items-center gap-2">
            <PrioritizedAccountSelect
              accounts={accounts}
              loading={accountsLoading}
              value={selectedAccountId || "all"}
              onChange={(value) => setSelectedAccountId(value === "all" ? null : value)}
              userEmail={currentUser?.email}
              userRole={currentUserRole}
              placeholder="Filtrar por conta"
              className="w-full sm:w-[280px]"
              showAllOption={true}
              showInactiveToggle={false}
            />

            {selectedAccountId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="h-10 px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Search and other filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou conta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="report">Relatório</SelectItem>
              <SelectItem value="plan">Planejamento</SelectItem>
              <SelectItem value="pitch">Pitch</SelectItem>
            </SelectContent>
          </Select>

          {/* Identity filter */}
          <Select value={identityFilter} onValueChange={setIdentityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Identidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas identidades</SelectItem>
              <SelectItem value="jumper">Jumper</SelectItem>
              <SelectItem value="koko">Koko</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "title")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Mais recentes</SelectItem>
              <SelectItem value="title">Título (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Decks grid */}
      {filteredDecks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Presentation className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || typeFilter !== "all" || identityFilter !== "all"
              ? "Nenhum deck encontrado"
              : "Nenhum deck criado ainda"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchQuery || typeFilter !== "all" || identityFilter !== "all"
              ? "Tente ajustar os filtros ou buscar por outros termos."
              : canCreate
              ? "Comece criando seu primeiro deck de apresentação."
              : "Aguarde até que algum deck seja criado para sua conta."}
          </p>
          {canCreate && (
            <Button onClick={() => navigate("/decks/new")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Primeiro Deck
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={handleEdit}
              onShare={handleShare}
              onDelete={handleDelete}
              canEdit={canCreate} // Staff can edit all decks
              canDelete={userRole === "admin"} // Only admins can delete
            />
          ))}
        </div>
      )}
    </div>
  );
}
