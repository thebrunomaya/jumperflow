/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Shield,
  Calendar,
  Clock,
  Hash,
  Key,
  Activity,
  BarChart,
  History,
  Edit,
  UserX,
  UserCheck,
  LogOut,
} from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    nome: string | null;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    login_count: number;
    created_at: string;
    accounts?: Array<{ name: string; role: string }>;
    creativeCount?: number;
    auditHistory?: Array<{
      id: string;
      action: string;
      admin_email: string;
      old_value: any;
      new_value: any;
      reason: string | null;
      created_at: string;
    }>;
  } | null;
  onChangeRole: (user: any) => void;
  onToggleStatus: (user: any) => void;
  onResetPassword: (user: any) => void;
  onForceLogout: (user: any) => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  gerente: 'Gerente',
  user: 'User',
};

const actionLabels: Record<string, string> = {
  role_changed: 'Role alterado',
  deactivated: 'Conta desativada',
  reactivated: 'Conta reativada',
  password_reset: 'Senha resetada',
  user_created: 'Usuário criado',
  forced_logout: 'Logout forçado',
};

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'Nunca';

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `há ${diffMins}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  return formatDate(timestamp);
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
  onForceLogout,
}) => {
  if (!user) return null;

  const displayName = user.nome || user.email.split('@')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes: {displayName}
            <Badge variant={user.is_active ? 'default' : 'destructive'}>
              {user.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Informações completas e histórico de atividades
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Informações Básicas
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Role no app</p>
                    <p className="font-medium">{roleLabels[user.role] || user.role}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Último login</p>
                    <p className="font-medium">{formatRelativeTime(user.last_login_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Total de logins</p>
                    <p className="font-medium">{user.login_count || 0}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Key className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">ID do usuário</p>
                    <p className="font-medium text-xs truncate">{user.id}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Accounts Section */}
            {user.accounts && user.accounts.length > 0 && (
              <>
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Contas Vinculadas ({user.accounts.length})
                  </h4>
                  <div className="space-y-2">
                    {user.accounts.map((account, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <span className="font-medium">{account.name}</span>
                        <Badge variant="outline">{account.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Activity Stats */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Atividade
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Criativos Submetidos</p>
                  <p className="text-2xl font-bold">{user.creativeCount || 0}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Contas Acessadas</p>
                  <p className="text-2xl font-bold">{user.accounts?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Audit History */}
            {user.auditHistory && user.auditHistory.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Mudanças (últimas 10)
                  </h4>
                  <div className="space-y-2">
                    {user.auditHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-muted/30 rounded-lg space-y-1 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {actionLabels[entry.action] || entry.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          por <span className="font-medium">{entry.admin_email}</span>
                        </p>
                        {entry.old_value && entry.new_value && (
                          <p className="text-xs">
                            {JSON.stringify(entry.old_value)} → {JSON.stringify(entry.new_value)}
                          </p>
                        )}
                        {entry.reason && (
                          <p className="text-xs italic">{entry.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <Separator />
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChangeRole(user);
                onClose();
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Alterar Role
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onResetPassword(user);
                onClose();
              }}
            >
              <Key className="mr-2 h-4 w-4" />
              Resetar Senha
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onForceLogout(user);
                onClose();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Forçar Logout
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={user.is_active ? 'destructive' : 'default'}
              size="sm"
              onClick={() => {
                onToggleStatus(user);
                onClose();
              }}
            >
              {user.is_active ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reativar
                </>
              )}
            </Button>

            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
