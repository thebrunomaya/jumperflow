/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Key,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface UserCardProps {
  user: {
    id: string;
    email: string;
    nome: string | null;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    login_count: number;
    created_at: string;
    accountCount?: number;
    creativeCount?: number;
  };
  onViewDetails: (user: any) => void;
  onChangeRole: (user: any) => void;
  onToggleStatus: (user: any) => void;
  onResetPassword: (user: any) => void;
  onForceLogout: (user: any) => void;
}

const roleColors: Record<string, string> = {
  admin: 'bg-orange-500 hover:bg-orange-600 text-white',
  manager: 'bg-blue-500 hover:bg-blue-600 text-white',
  supervisor: 'bg-purple-500 hover:bg-purple-600 text-white',
  gerente: 'bg-green-500 hover:bg-green-600 text-white',
  user: 'bg-gray-400 hover:bg-gray-500 text-white',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  gerente: 'Gerente',
  user: 'User',
};

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
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onViewDetails,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
  onForceLogout,
}) => {
  const displayName = user.nome || user.email.split('@')[0];
  const lastLogin = formatRelativeTime(user.last_login_at);

  return (
    <Card className={`transition-all hover:shadow-md ${!user.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Left section - User info */}
          <div className="flex-1 space-y-3">
            {/* Name and email */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <Badge className={roleColors[user.role] || roleColors.user}>
                  {roleLabels[user.role] || user.role}
                </Badge>
                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Último login: {lastLogin}</span>
              <span>•</span>
              <span>Contas: {user.accountCount || 0}</span>
              <span>•</span>
              <span>Criativos: {user.creativeCount || 0}</span>
              <span>•</span>
              <span>Logins: {user.login_count || 0}</span>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(user)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onChangeRole(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Alterar Role
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onResetPassword(user)}>
                  <Key className="mr-2 h-4 w-4" />
                  Resetar Senha
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onForceLogout(user)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Forçar Logout
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onToggleStatus(user)}
                  className={user.is_active ? 'text-destructive' : 'text-green-600'}
                >
                  {user.is_active ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Desativar Conta
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Reativar Conta
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
