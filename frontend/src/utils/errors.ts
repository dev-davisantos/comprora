import { ApiError } from '@/api/client';

export function getFriendlyErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
  return fallbackMessage;
}
