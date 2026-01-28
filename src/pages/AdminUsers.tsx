/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import {
  UserCard,
  UserDetailsModal,
  ChangeRoleDialog,
  UserMetrics,
  UserFilters,
} from '@/components/admin/users';

interface User {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
  accountCount?: number;
  creativeCount?: number;
  accounts?: Array<{ name: string; role: string }>;
  auditHistory?: Array<any>;
}

const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // State for modals and dialogs
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);

  useEffect(() => {
    document.title = 'Gerenciamento de Usuários • Jumper Flow';
  }, []);

  // Fetch users list
  const fetchUsers = async (): Promise<User[]> => {
    if (!currentUser) {
      throw new Error('Não autenticado');
    }

    const { data, error } = await supabase.functions.invoke('j_hub_admin_users', {
      body: { action: 'list' },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Falha ao carregar usuários');

    return data.users as User[];
  };

  const { data: users = [], isFetching, refetch } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  });

  // Fetch user details
  const fetchUserDetails = async (userId: string): Promise<User> => {
    const { data, error } = await supabase.functions.invoke('j_hub_admin_users', {
      body: { action: 'getDetails', userId },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Falha ao carregar detalhes');

    return data.user as User;
  };

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
      reason,
    }: {
      userId: string;
      newRole: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('j_hub_admin_users', {
        body: { action: 'changeRole', userId, newRole, reason },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao alterar role');

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Role alterado com sucesso',
        description: 'As permissões do usuário foram atualizadas.',
      });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao alterar role',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke('j_hub_admin_users', {
        body: { action: 'toggleStatus', userId, reason },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao alterar status');

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Status alterado com sucesso',
        description: 'O status do usuário foi atualizado.',
      });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('j_hub_admin_users', {
        body: { action: 'resetPassword', userId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao resetar senha');

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Email enviado',
        description: 'Email de recuperação de senha foi enviado ao usuário.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao resetar senha',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Force logout mutation
  const forceLogoutMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('j_hub_admin_users', {
        body: { action: 'forceLogout', userId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao forçar logout');

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Logout forçado',
        description: 'O usuário foi desconectado de todas as sessões.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao forçar logout',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle view details
  const handleViewDetails = async (user: User) => {
    try {
      const details = await fetchUserDetails(user.id);
      setDetailsUser(details);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          user.nome?.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => user.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((user) => !user.is_active);
    }

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Gerenciamento de Usuários
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie permissões, visualize atividades e controle acessos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-[#FA4721] hover:bg-[#E03E1A] text-white"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                />
                {isFetching ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Link to="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Admin
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section>
          <UserMetrics
            users={users}
            onFilterChange={(filter) => {
              if (filter === 'active' || filter === 'inactive') {
                setStatusFilter(filter);
                setRoleFilter(null);
              } else {
                setRoleFilter(filter);
                setStatusFilter(null);
              }
            }}
            activeFilter={roleFilter || statusFilter}
          />
        </section>

        {/* Main Content */}
        <section>
          <Card className="overflow-hidden">
            {/* Gray Header - Filters */}
            <div className="bg-muted/30 px-6 py-4 border-b">
              <UserFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                totalResults={filteredUsers.length}
              />
            </div>

            {/* Content - Users List */}
            <CardContent className="p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    {isFetching
                      ? 'Carregando usuários...'
                      : searchQuery || roleFilter || statusFilter
                        ? 'Nenhum usuário encontrado com os filtros aplicados'
                        : 'Nenhum usuário encontrado'}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onViewDetails={handleViewDetails}
                      onChangeRole={setChangeRoleUser}
                      onToggleStatus={(u) =>
                        toggleStatusMutation.mutate({ userId: u.id })
                      }
                      onResetPassword={(u) => resetPasswordMutation.mutate(u.id)}
                      onForceLogout={(u) => forceLogoutMutation.mutate(u.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Modals */}
        <UserDetailsModal
          isOpen={!!detailsUser}
          onClose={() => setDetailsUser(null)}
          user={detailsUser}
          onChangeRole={setChangeRoleUser}
          onToggleStatus={(u) => toggleStatusMutation.mutate({ userId: u.id })}
          onResetPassword={(u) => resetPasswordMutation.mutate(u.id)}
          onForceLogout={(u) => forceLogoutMutation.mutate(u.id)}
        />

        <ChangeRoleDialog
          isOpen={!!changeRoleUser}
          onClose={() => setChangeRoleUser(null)}
          user={changeRoleUser}
          onConfirm={(userId, newRole, reason) =>
            changeRoleMutation.mutateAsync({ userId, newRole, reason })
          }
          isLoading={changeRoleMutation.isPending}
        />
      </main>
    </>
  );
};

export default AdminUsersPage;
