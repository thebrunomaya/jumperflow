/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, Building2, AlertCircle, Filter } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AccountSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSelectorModal({ isOpen, onClose }: AccountSelectorModalProps) {
  const navigate = useNavigate();
  const { clients, loading, error, isAdmin, userAccessibleAccounts } = useNotionClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Filter clients based on search term, user permissions, status, and tier
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasAccess = isAdmin || userAccessibleAccounts.includes(client.id);
    const matchesStatus = statusFilter === 'all' || (client as any).status === statusFilter;
    const matchesTier = tierFilter === 'all' || (client as any).tier === tierFilter;
    return matchesSearch && hasAccess && matchesStatus && matchesTier;
  });

  // Get unique statuses and tiers for filters
  const availableStatuses = [...new Set(clients.map((c: any) => c.status).filter(Boolean))];
  const availableTiers = [...new Set(clients.map((c: any) => c.tier).filter(Boolean))];

  // Group clients by first letter for better organization
  const groupedClients = filteredClients.reduce((acc, client) => {
    const firstLetter = client.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(client);
    return acc;
  }, {} as Record<string, typeof clients>);

  const handleSelectAccount = (accountId: string, accountName: string) => {
    setSelectedAccount(accountId);
    // Navigate to dashboards page with account as URL parameter
    navigate(`/dashboards/${encodeURIComponent(accountName)}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Selecionar Conta para Relatórios</DialogTitle>
          <DialogDescription>
            Escolha a conta que deseja visualizar os relatórios de performance
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {(availableStatuses.length > 0 || availableTiers.length > 0) && (
          <div className="flex gap-3">
            {availableStatuses.length > 0 && (
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {availableTiers.length > 0 && (
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tier</label>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tiers</SelectItem>
                    {availableTiers.map(tier => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Accounts List */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="text-center text-muted-foreground">
                Erro ao carregar contas: {error}
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-center text-muted-foreground">
                {searchTerm
                  ? 'Nenhuma conta encontrada com esse termo'
                  : 'Você não tem acesso a nenhuma conta'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedClients)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, accounts]) => (
                  <div key={letter}>
                    <div className="sticky top-0 bg-background z-10 pb-2">
                      <Badge variant="outline" className="mb-2">
                        {letter}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {accounts.map((account) => (
                        <Button
                          key={account.id}
                          variant="outline"
                          className={cn(
                            "w-full justify-between p-4 h-auto",
                            selectedAccount === account.id && "border-primary bg-primary/5"
                          )}
                          onClick={() => handleSelectAccount(account.id, account.name)}
                        >
                          <div className="flex items-center gap-3 text-left flex-1">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{account.name}</p>
                                {(account as any).tier && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    {(account as any).tier}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {account.objectives && account.objectives.length > 0 && (
                                  <span>
                                    {account.objectives.length} objetivo{account.objectives.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {(account as any).gestor && (
                                  <span>Gestor: {(account as any).gestor}</span>
                                )}
                                {(account as any).status && (
                                  <Badge 
                                    variant={(account as any).status === 'Ativa' ? 'default' : 'secondary'} 
                                    className="text-xs px-1.5 py-0.5"
                                  >
                                    {(account as any).status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Info */}
        {!loading && !error && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredClients.length} conta{filteredClients.length !== 1 ? 's' : ''} disponíve{filteredClients.length !== 1 ? 'is' : 'l'}
            </p>
            {isAdmin && (
              <Badge variant="secondary">
                Acesso Admin
              </Badge>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}