/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole } from '@/hooks/useUserRole';

// Types for logging
export interface LogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

export interface ConditionalLogger {
  pushLog: (level: LogEntry['level'], message: string, data?: unknown) => void;
  consoleLog: (message: string, ...args: any[]) => void;
  consoleWarn: (message: string, ...args: any[]) => void;
  consoleError: (message: string, ...args: any[]) => void;
  shouldLog: () => boolean;
}

/**
 * Creates a conditional logger that only logs for privileged users (admin/gestor)
 */
export const createConditionalLogger = (
  userRole: UserRole,
  setSubmissionLog?: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  sanitizeData?: (data: any) => any
): ConditionalLogger => {
  
  // Check if user should see debug logs (admin or manager/gestor)
  const shouldLog = (): boolean => {
    return userRole === 'admin' || userRole === 'manager';
  };

  // Safe sanitization function
  const safeSanitize = (data: unknown): unknown => {
    if (!sanitizeData) return data;
    try {
      return sanitizeData(data);
    } catch {
      return '<sanitization-error>';
    }
  };

  const pushLog = (level: LogEntry['level'], message: string, data?: unknown) => {
    if (!shouldLog() || !setSubmissionLog) return;

    const entry: LogEntry = {
      ts: Date.now(),
      level,
      message,
      data: data ? safeSanitize(data) : undefined
    };
    
    setSubmissionLog(prev => [...prev, entry]);
  };

  const consoleLog = (message: string, ...args: any[]) => {
    if (!shouldLog()) return;
    console.log(message, ...args);
  };

  const consoleWarn = (message: string, ...args: any[]) => {
    if (!shouldLog()) return;
    console.warn(message, ...args);
  };

  const consoleError = (message: string, ...args: any[]) => {
    if (!shouldLog()) return;
    console.error(message, ...args);
  };

  return {
    pushLog,
    consoleLog,
    consoleWarn,
    consoleError,
    shouldLog
  };
};

/**
 * Simple conditional console logger for components without submission logs
 */
export const createSimpleConditionalLogger = (userRole: UserRole) => {
  const shouldLog = userRole === 'admin' || userRole === 'manager';

  return {
    log: (message: string, ...args: any[]) => {
      if (shouldLog) console.log(message, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog) console.warn(message, ...args);
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog) console.error(message, ...args);
    },
    shouldLog
  };
};