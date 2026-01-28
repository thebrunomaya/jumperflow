/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Optimization Page - Panel View
 * Shows all optimizations from user's accessible accounts
 * Similar to MyAccounts page logic
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMyOptimizations } from "@/hooks/useMyOptimizations";
import { useMyNotionAccounts } from "@/hooks/useMyNotionAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { OptimizationsPanelList } from "@/components/optimization/OptimizationsPanelList";
import { PrioritizedAccountSelect } from "@/components/shared/PrioritizedAccountSelect";
import { JumperBackground } from "@/components/ui/jumper-background";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import Header from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { JumperButton } from "@/components/ui/jumper-button";

export default function Optimization() {
  const navigate = useNavigate();
  const { optimizations, loading, error } = useMyOptimizations();
  const { accounts: allAccounts } = useMyNotionAccounts(); // Get complete account data
  const { userRole } = useUserRole();
  const { currentUser } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Use ALL accessible accounts (don't filter by optimizations)
  // This ensures dropdown shows all accounts, even those with 0 optimizations
  const availableAccounts = allAccounts;

  // Filter optimizations by selected account
  // Now both use UUID: dropdown uses account.id, optimizations use account_uuid (mapped to account_id)
  const filteredOptimizations = useMemo(() => {
    if (!selectedAccountId) return optimizations;
    // Direct UUID comparison - useMyOptimizations now returns account_uuid as account_id
    return optimizations.filter(opt => opt.account_id === selectedAccountId);
  }, [optimizations, selectedAccountId]);

  const handleOptimizationClick = (optimization: any) => {
    // Navigate to fullscreen editor
    navigate(`/optimization/editor/${optimization.recording_id}`);
  };

  const handleClearFilter = () => {
    setSelectedAccountId(null);
  };

  if (loading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-jumper-orange mx-auto" />
              <p className="text-muted-foreground">Carregando otimizações...</p>
            </div>
          </div>
        </main>
      </JumperBackground>
    );
  }

  if (error) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar otimizações: {error}
            </AlertDescription>
          </Alert>
        </main>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
                <Sparkles className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Painel de Otimizações
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredOptimizations.length} {filteredOptimizations.length === 1 ? 'otimização' : 'otimizações'}
                  {selectedAccountId && ' nesta conta'}
                  {!selectedAccountId && ' nas suas contas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* New Optimization Button */}
              <JumperButton
                onClick={() => navigate('/optimization/new')}
                className="whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Otimização
              </JumperButton>

              {/* Account Filter */}
              {availableAccounts.length > 1 && (
                <div className="flex items-center gap-2">
                  <PrioritizedAccountSelect
                    accounts={availableAccounts}
                    value={selectedAccountId || "all"}
                    onChange={(value) => setSelectedAccountId(value === "all" ? null : value)}
                    userEmail={currentUser?.email}
                    userRole={userRole}
                    placeholder="Filtrar por conta"
                    className="w-[280px]"
                    showAllOption={true}
                    showInactiveToggle={false}
                  />

                  {selectedAccountId && (
                    <JumperButton
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilter}
                      className="h-10 px-3"
                    >
                      <X className="h-4 w-4" />
                    </JumperButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Optimizations List */}
        <OptimizationsPanelList
          optimizations={filteredOptimizations}
          onOptimizationClick={handleOptimizationClick}
        />
      </main>
    </JumperBackground>
  );
}

