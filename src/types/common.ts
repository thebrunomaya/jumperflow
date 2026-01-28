/**
 * Common utility types used across the application
 */

// Generic record type for objects with unknown shape
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | Error;
  message?: string;
}

// Supabase error type
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// File upload types
export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
}

// Saved media structure for creative system
export interface SavedMediaFile {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
  format?: string;
}

export interface SavedMediaVariation {
  id: number;
  squareEnabled?: boolean;
  verticalEnabled?: boolean;
  horizontalEnabled?: boolean;
  squareFile?: SavedMediaFile;
  verticalFile?: SavedMediaFile;
  horizontalFile?: SavedMediaFile;
}

export interface SavedCarouselCard {
  id: number;
  file?: SavedMediaFile;
  customTitle?: string;
  customDescription?: string;
  customDestinationUrl?: string;
  customCta?: string;
}

export interface SavedMedia {
  variations?: SavedMediaVariation[];
  carouselCards?: SavedCarouselCard[];
}

// Event handler types
export type InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;
export type SelectChangeHandler = (value: string) => void;
export type FormSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => void;

// Generic callback types
export type VoidCallback = () => void;
export type AsyncCallback = () => Promise<void>;
export type ProgressCallback = (current: number, total: number, message: string) => void;

// Table/list item with status
export interface StatusItem {
  status: string;
  [key: string]: unknown;
}

// Notion sync response
export interface NotionSyncResponse {
  success: boolean;
  metadata?: {
    accounts_synced?: number;
    managers_synced?: number;
    deleted_orphan_accounts?: number;
    deleted_orphan_managers?: number;
  };
  error?: string;
}

// User role types
export type UserRole = 'admin' | 'staff' | 'client' | null;

// Dashboard metric types
export interface MetricData {
  value: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
}
