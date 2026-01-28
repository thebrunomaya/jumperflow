import React, { useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface SyncLog {
  id: string;
  started_at: string;
  completed_at?: string;
  status: 'success' | 'failed' | 'partial' | 'running';
  records_processed: number;
  execution_time_ms: number;
  error_message?: string;
}

interface SyncStatus {
  isRunning: boolean;
  lastSync?: {
    started_at: string;
    status: 'success' | 'failed' | 'partial';
    records_processed: number;
    execution_time_ms: number;
  };
}

export const NotionSyncControl: React.FC = () => {
  const { currentUser } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isRunning: false });
  const [logs, setLogs] = useState<SyncLog[]>([]);

  const handleAccountsSync = async () => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSyncStatus({ ...syncStatus, isRunning: true });
    toast.info('Iniciando sincronização de contas...');

    try {
      const { data, error } = await supabase.functions.invoke('j_hub_notion_sync_accounts');

      if (error) {
        throw error;
      }

      if (data.ok) {
        const deletedMsg = data.synced.deleted > 0
          ? ` (${data.synced.deleted} contas órfãs removidas)`
          : '';
        toast.success(`Sincronização concluída! ${data.synced.accounts} contas sincronizadas${deletedMsg}`);
        setSyncStatus({
          isRunning: false,
          lastSync: {
            started_at: new Date().toISOString(),
            status: 'success',
            records_processed: data.synced.accounts,
            execution_time_ms: 0
          }
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
      
      // Recarregar logs após sincronização
      await loadSyncLogs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro na sincronização:', err);
      toast.error(`Erro na sincronização: ${errorMessage}`);
      setSyncStatus({
        isRunning: false,
        lastSync: {
          started_at: new Date().toISOString(),
          status: 'failed',
          records_processed: 0,
          execution_time_ms: 0
        }
      });
    }
  };

  const handleManagersSync = async () => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSyncStatus({ ...syncStatus, isRunning: true });
    toast.info('Iniciando sincronização de gerentes...');

    try {
      const { data, error } = await supabase.functions.invoke('j_hub_notion_sync_managers');

      if (error) {
        throw error;
      }

      if (data.ok) {
        toast.success(`Sincronização concluída! ${data.synced.managers} gerentes sincronizados.`);
        setSyncStatus({
          isRunning: false,
          lastSync: {
            started_at: new Date().toISOString(),
            status: 'success',
            records_processed: data.synced.managers,
            execution_time_ms: 0
          }
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
      
      // Recarregar logs após sincronização
      await loadSyncLogs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro na sincronização:', err);
      toast.error(`Erro na sincronização de gerentes: ${errorMessage}`);
      setSyncStatus({
        isRunning: false,
        lastSync: {
          started_at: new Date().toISOString(),
          status: 'failed',
          records_processed: 0,
          execution_time_ms: 0
        }
      });
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('j_hub_notion_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao carregar logs:', error);
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  };

  React.useEffect(() => {
    loadSyncLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {/* Grid de Sincronização */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contas */}
        <div className="space-y-2">
          <div className="text-sm font-medium">DB_Contas</div>
          <div className="text-xs text-muted-foreground mb-2">
            75 campos • Canal SoWork, IDs Meta/Google
          </div>
          <Button
            onClick={handleAccountsSync}
            disabled={syncStatus.isRunning}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {syncStatus.isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Contas
              </>
            )}
          </Button>
        </div>

        {/* Gerentes */}
        <div className="space-y-2">
          <div className="text-sm font-medium">DB_Gerentes</div>
          <div className="text-xs text-muted-foreground mb-2">
            10 campos • Nome, Email, Função
          </div>
          <Button
            onClick={handleManagersSync}
            disabled={syncStatus.isRunning}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {syncStatus.isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Gerentes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status da Última Sincronização */}
      {syncStatus.lastSync && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(syncStatus.lastSync.status)}
            <span>
              Última sincronização: {formatDate(syncStatus.lastSync.started_at)}
            </span>
            <span>•</span>
            <span>{syncStatus.lastSync.records_processed} registros</span>
            {syncStatus.lastSync.execution_time_ms > 0 && (
              <>
                <span>•</span>
                <span>{formatDuration(syncStatus.lastSync.execution_time_ms)}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};