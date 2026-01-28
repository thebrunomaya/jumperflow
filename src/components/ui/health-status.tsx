/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react';
import { performSystemHealthCheck } from '@/utils/systemHealth';
import type { SystemHealthStatus } from '@/utils/systemHealth';

interface HealthStatusProps {
  className?: string;
  showDetails?: boolean;
  onHealthChange?: (status: SystemHealthStatus) => void;
}

export const HealthStatus: React.FC<HealthStatusProps> = ({ 
  className = '', 
  showDetails = false,
  onHealthChange 
}) => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const status = await performSystemHealthCheck();
      setHealthStatus(status);
      setLastCheck(Date.now());
      onHealthChange?.(status);
    } catch (error) {
      console.error('Health check failed:', error);
      // Create a fallback status indicating unknown health
      const fallbackStatus: SystemHealthStatus = {
        overall: false,
        services: {
          supabase: { healthy: false, service: 'supabase', error: 'Check failed', timestamp: Date.now() },
          edgeFunctions: { healthy: false, service: 'edgeFunctions', error: 'Check failed', timestamp: Date.now() },
          storage: { healthy: false, service: 'storage', error: 'Check failed', timestamp: Date.now() }
        },
        canSubmit: false,
        warnings: ['Sistema health check failed - status unknown']
      };
      setHealthStatus(fallbackStatus);
      onHealthChange?.(fallbackStatus);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check health on mount and periodically
  useEffect(() => {
    checkHealth();
    
    // Set up periodic health checks every 2 minutes
    const interval = setInterval(checkHealth, 120000);
    
    return () => clearInterval(interval);
   
  }, []);

  // Auto-refresh if health status is stale (older than 5 minutes)
   
  useEffect(() => {
    if (lastCheck && Date.now() - lastCheck > 300000) {
      checkHealth();
    }
  }, [lastCheck]);

  if (!healthStatus) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando sistema...</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (healthStatus.overall) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (healthStatus.canSubmit) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (isChecking) return 'Verificando...';
    
    if (healthStatus.overall) {
      return 'Sistema saudável';
    } else if (healthStatus.canSubmit) {
      return 'Sistema degradado';
    } else {
      return 'Sistema indisponível';
    }
  };

  const getStatusColor = () => {
    if (healthStatus.overall) return 'text-green-700';
    if (healthStatus.canSubmit) return 'text-yellow-700';
    return 'text-red-700';
  };

  const formatLastCheck = () => {
    if (!lastCheck) return '';
    const secondsAgo = Math.floor((Date.now() - lastCheck) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s atrás`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo}m atrás`;
  };

  return (
    <div className={className}>
      {/* Compact Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {lastCheck && (
            <span className="text-xs text-muted-foreground">
              {formatLastCheck()}
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={isChecking}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Warnings Display */}
      {healthStatus.warnings.length > 0 && (
        <Alert className="mt-2 py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {healthStatus.warnings.slice(0, 2).join('. ')}
            {healthStatus.warnings.length > 2 && ` +${healthStatus.warnings.length - 2} mais`}
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Status (if requested) */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Status dos Serviços:</div>
          
          {Object.entries(healthStatus.services).map(([serviceName, service]) => (
            <div key={serviceName} className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                {service.healthy ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs capitalize">
                  {serviceName === 'edgeFunctions' ? 'Edge Functions' : serviceName}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                {service.responseTime && (
                  <span className="text-xs text-muted-foreground">
                    {service.responseTime}ms
                  </span>
                )}
                <Badge 
                  variant={service.healthy ? 'default' : 'destructive'}
                  className="h-4 text-xs px-1"
                >
                  {service.healthy ? 'OK' : 'ERRO'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Status */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Submissões: 
        </span>
        <Badge 
          variant={healthStatus.canSubmit ? 'default' : 'destructive'}
          className="h-4 text-xs px-2"
        >
          {healthStatus.canSubmit ? 'Disponíveis' : 'Bloqueadas'}
        </Badge>
      </div>
    </div>
  );
};

// Hook for using health status in components
export const useHealthStatus = () => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const status = await performSystemHealthCheck();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return {
    healthStatus,
    isChecking,
    checkHealth,
    canSubmit: healthStatus?.canSubmit ?? false,
    isHealthy: healthStatus?.overall ?? false
  };
};