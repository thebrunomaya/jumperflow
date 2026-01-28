/**
 * Utility functions for error handling
 */

/**
 * Safely extracts error message from unknown error type
 * @param err - The caught error (unknown type)
 * @returns A string message describing the error
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Erro desconhecido';
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  );
}
