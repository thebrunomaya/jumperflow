/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface OptimizationDraft {
  accountId: string;
  dateRange: { start: string; end: string };
  customContext: string;
  platform: "meta" | "google";
  objectives: string[];
  createdAt: string;
  // Note: audioBlob cannot be stored in localStorage (size limits)
  // Audio must be re-recorded if user returns to draft
}

const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY_PREFIX = "optimization_draft_";

export function useDraftManager() {
  const { user } = useAuth();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  const getStorageKey = useCallback(() => {
    if (!user?.email) return null;
    return `${STORAGE_KEY_PREFIX}${user.email}`;
  }, [user?.email]);

  /**
   * Save draft to localStorage
   */
  const saveDraft = useCallback(
    (draft: Partial<OptimizationDraft>) => {
      const key = getStorageKey();
      if (!key) return;

      try {
        const existingDraft = loadDraft();
        const updatedDraft: OptimizationDraft = {
          accountId: draft.accountId || existingDraft?.accountId || "",
          dateRange: draft.dateRange || existingDraft?.dateRange || {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
          },
          customContext: draft.customContext || existingDraft?.customContext || "",
          platform: draft.platform || existingDraft?.platform || "meta",
          objectives: draft.objectives || existingDraft?.objectives || [],
          createdAt: existingDraft?.createdAt || new Date().toISOString(),
        };

        localStorage.setItem(key, JSON.stringify(updatedDraft));
        isDirtyRef.current = false;
        console.log("✅ Draft auto-saved", updatedDraft);
      } catch (error) {
        console.error("❌ Failed to save draft:", error);
      }
    },
    [getStorageKey]
  );

  /**
   * Load draft from localStorage
   */
   
  const loadDraft = useCallback((): OptimizationDraft | null => {
    const key = getStorageKey();
    if (!key) return null;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const draft = JSON.parse(stored) as OptimizationDraft;

      // Check if draft is older than 7 days (expired)
      const createdAt = new Date(draft.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) {
        console.log("⚠️ Draft expired (>7 days), clearing");
        clearDraft();
        return null;
      }

      return draft;
    } catch (error) {
      console.error("❌ Failed to load draft:", error);
      return null;
    }
  }, [getStorageKey]);

  /**
   * Clear draft from localStorage
   */
   
  const clearDraft = useCallback(() => {
    const key = getStorageKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
      isDirtyRef.current = false;
      console.log("✅ Draft cleared");
    } catch (error) {
      console.error("❌ Failed to clear draft:", error);
    }
  }, [getStorageKey]);

  /**
   * Check if draft exists
   */
  const hasDraft = useCallback((): boolean => {
    return loadDraft() !== null;
  }, [loadDraft]);

  /**
   * Mark draft as dirty (needs saving)
   */
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  /**
   * Start auto-save timer (debounced)
   */
  const startAutoSave = useCallback(
    (draft: Partial<OptimizationDraft>) => {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(() => {
        if (isDirtyRef.current) {
          saveDraft(draft);
        }
      }, AUTOSAVE_INTERVAL);
    },
    [saveDraft]
  );

  /**
   * Handle beforeunload (user navigating away)
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Modern browsers ignore custom message, but we still need to call preventDefault
        e.preventDefault();
        e.returnValue = "";

        // Attempt immediate save (may not complete if page unloads)
        const key = getStorageKey();
        if (key) {
          try {
            const existingDraft = loadDraft();
            if (existingDraft) {
              localStorage.setItem(key, JSON.stringify(existingDraft));
            }
          } catch (error) {
            console.error("Failed to save on unload:", error);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [getStorageKey, loadDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    markDirty,
    startAutoSave,
  };
}
