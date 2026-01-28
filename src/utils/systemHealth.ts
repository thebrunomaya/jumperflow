/* eslint-disable @typescript-eslint/no-explicit-any */
// System health checking utilities for defensive validation
// Ensures managers can always submit, even when external services are degraded

interface HealthCheckResult {
  healthy: boolean;
  service: string;
  responseTime?: number;
  error?: string;
  timestamp: number;
}

export interface SystemHealthStatus {
  overall: boolean;
  services: {
    supabase: HealthCheckResult;
    edgeFunctions: HealthCheckResult;
    storage: HealthCheckResult;
  };
  canSubmit: boolean;
  warnings: string[];
}

// Cache health check results to avoid spam
const healthCache = new Map<string, HealthCheckResult>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Check if cached result is still valid
function isCacheValid(result: HealthCheckResult): boolean {
  return Date.now() - result.timestamp < CACHE_DURATION;
}

// Health check for Supabase connection
async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const cacheKey = 'supabase';
  const cached = healthCache.get(cacheKey);
  
  if (cached && isCacheValid(cached)) {
    return cached;
  }
  
  const startTime = Date.now();
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('j_ads_creative_submissions')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      const result: HealthCheckResult = {
        healthy: false,
        service: 'supabase',
        responseTime,
        error: error.message,
        timestamp: Date.now()
      };
      healthCache.set(cacheKey, result);
      return result;
    }
    
    const result: HealthCheckResult = {
      healthy: true,
      service: 'supabase',
      responseTime,
      timestamp: Date.now()
    };
    
    healthCache.set(cacheKey, result);
    return result;
    
  } catch (error: any) {
    const result: HealthCheckResult = {
      healthy: false,
      service: 'supabase',
      responseTime: Date.now() - startTime,
      error: error?.message || 'Connection failed',
      timestamp: Date.now()
    };
    
    healthCache.set(cacheKey, result);
    return result;
  }
}

// Health check for Edge Functions
async function checkEdgeFunctionsHealth(): Promise<HealthCheckResult> {
  const cacheKey = 'edgeFunctions';
  const cached = healthCache.get(cacheKey);
  
  if (cached && isCacheValid(cached)) {
    return cached;
  }
  
  const startTime = Date.now();
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test with a lightweight manager action
    const { data, error } = await supabase.functions.invoke('j_hub_manager_dashboard', {
      body: { action: 'healthCheck' }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Edge functions are considered healthy if they respond, even with expected errors
    // 401 Unauthorized means the function is working but requires auth (which is expected)
    const isHealthy = !error || 
                     error.message?.includes('healthCheck') || 
                     error.message?.includes('Unknown action') ||
                     error.message?.includes('non-2xx status code') ||
                     (error as any)?.context?.status === 401;
    
    const result: HealthCheckResult = {
      healthy: isHealthy,
      service: 'edgeFunctions',
      responseTime,
      error: isHealthy ? undefined : error?.message,
      timestamp: Date.now()
    };
    
    healthCache.set(cacheKey, result);
    return result;
    
  } catch (error: any) {
    const result: HealthCheckResult = {
      healthy: false,
      service: 'edgeFunctions',
      responseTime: Date.now() - startTime,
      error: error?.message || 'Function invocation failed',
      timestamp: Date.now()
    };
    
    healthCache.set(cacheKey, result);
    return result;
  }
}

// Health check for Storage
async function checkStorageHealth(): Promise<HealthCheckResult> {
  const cacheKey = 'storage';
  const cached = healthCache.get(cacheKey);
  
  if (cached && isCacheValid(cached)) {
    return cached;
  }
  
  const startTime = Date.now();
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test storage by listing buckets (lightweight operation)
    const { data, error } = await supabase.storage.listBuckets();
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      const result: HealthCheckResult = {
        healthy: false,
        service: 'storage',
        responseTime,
        error: error.message,
        timestamp: Date.now()
      };
      healthCache.set(cacheKey, result);
      return result;
    }
    
    const result: HealthCheckResult = {
      healthy: true,
      service: 'storage',
      responseTime,
      timestamp: Date.now()
    };
    
    healthCache.set(cacheKey, result);
    return result;
    
  } catch (error: any) {
    const result: HealthCheckResult = {
      healthy: false,
      service: 'storage',
      responseTime: Date.now() - startTime,
      error: error?.message || 'Storage access failed',
      timestamp: Date.now()
    };
    
    healthCache.set(cacheKey, result);
    return result;
  }
}

// Comprehensive system health check
export async function performSystemHealthCheck(): Promise<SystemHealthStatus> {
  console.log('🔍 Performing comprehensive system health check...');
  
  // Run all health checks in parallel for speed
  const [supabaseHealth, edgeFunctionsHealth, storageHealth] = await Promise.all([
    checkSupabaseHealth(),
    checkEdgeFunctionsHealth(),
    checkStorageHealth()
  ]);
  
  const services = {
    supabase: supabaseHealth,
    edgeFunctions: edgeFunctionsHealth,
    storage: storageHealth
  };
  
  // System is considered healthy if core services (Supabase + Storage) work
  const coreServicesHealthy = supabaseHealth.healthy && storageHealth.healthy;
  
  // Can submit if core services work, even if edge functions are degraded
  const canSubmit = coreServicesHealthy;
  
  const warnings: string[] = [];
  
  if (!edgeFunctionsHealth.healthy) {
    warnings.push('Edge Functions degraded - submissions may use fallback mode');
  }
  
  if (!storageHealth.healthy) {
    warnings.push('File storage unavailable - cannot upload new files');
  }
  
  if (!supabaseHealth.healthy) {
    warnings.push('Database connection issues - cannot save submissions');
  }
  
  // Add performance warnings
  const avgResponseTime = (
    (supabaseHealth.responseTime || 0) + 
    (edgeFunctionsHealth.responseTime || 0) + 
    (storageHealth.responseTime || 0)
  ) / 3;
  
  if (avgResponseTime > 5000) {
    warnings.push('System performance degraded - slower than usual');
  }
  
  const healthStatus: SystemHealthStatus = {
    overall: coreServicesHealthy,
    services,
    canSubmit,
    warnings
  };
  
  console.log('📊 Health check completed:', {
    overall: healthStatus.overall,
    canSubmit: healthStatus.canSubmit,
    responseTime: {
      supabase: supabaseHealth.responseTime,
      edgeFunctions: edgeFunctionsHealth.responseTime,
      storage: storageHealth.responseTime
    },
    warnings: warnings.length
  });
  
  return healthStatus;
}

// Pre-submission validation with health awareness
export async function validateSubmissionReadiness(formData: any): Promise<{
  canProceed: boolean;
  blockers: string[];
  warnings: string[];
  healthStatus: SystemHealthStatus;
}> {
  console.log('🔍 Validating submission readiness...');
  
  // Get health status
  const healthStatus = await performSystemHealthCheck();
  
  const blockers: string[] = [];
  const warnings: string[] = [...healthStatus.warnings];
  
  // Critical blockers (prevent submission)
  if (!healthStatus.services.supabase.healthy) {
    blockers.push('Database connection required for submissions');
  }
  
  if (!healthStatus.services.storage.healthy && hasFilesToUpload(formData)) {
    blockers.push('File storage required for media uploads');
  }
  
  // Form validation blockers
  if (!formData.creativeName?.trim()) {
    blockers.push('Creative name is required');
  }
  
  if (!formData.client) {
    blockers.push('Client selection is required');
  }
  
  if (!formData.platform) {
    blockers.push('Platform selection is required');
  }
  
  // Non-critical warnings
  if (!healthStatus.services.edgeFunctions.healthy) {
    warnings.push('External services degraded - submission will use backup processing');
  }
  
  const canProceed = blockers.length === 0 && healthStatus.canSubmit;
  
  return {
    canProceed,
    blockers,
    warnings,
    healthStatus
  };
}

// Check if form data contains files that need uploading
function hasFilesToUpload(formData: any): boolean {
  // Check various file sources
  if (formData.validatedFiles?.length > 0) return true;
  if (formData.mediaVariations?.some((v: any) => v.squareFile || v.verticalFile || v.horizontalFile)) return true;
  if (formData.carouselCards?.some((c: any) => c.file)) return true;
  
  return false;
}

// Recovery suggestions for common issues
export function getRecoverySuggestions(healthStatus: SystemHealthStatus): string[] {
  const suggestions: string[] = [];
  
  if (!healthStatus.services.supabase.healthy) {
    suggestions.push('Check your internet connection and try again');
    suggestions.push('Refresh the page to reconnect to the database');
  }
  
  if (!healthStatus.services.storage.healthy) {
    suggestions.push('File uploads may be temporarily unavailable');
    suggestions.push('Try uploading smaller files or fewer files at once');
  }
  
  if (!healthStatus.services.edgeFunctions.healthy) {
    suggestions.push('Some features may be slower than usual');
    suggestions.push('Your submission will still work, but may take longer to process');
  }
  
  if (!healthStatus.overall) {
    suggestions.push('Save your work as a draft and try submitting again later');
    suggestions.push('Contact support if the issue persists');
  }
  
  return suggestions;
}