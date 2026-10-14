/** Typed fetch wrapper for the backend API (proxied under /api). */

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Backend error payload: { statusCode, message, timestamp, path } */
function toApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = payload.message;
    if (typeof message === 'string') {
      return new ApiError(status, toFriendlyMessage(status, message));
    }
    if (Array.isArray(message)) {
      return new ApiError(status, toFriendlyMessage(status, message.join('; ')));
    }
  }
  return new ApiError(status, fallbackMessage(status));
}

function fallbackMessage(status: number): string {
  if (status === 400) return 'Verifique os dados informados e tente novamente.';
  if (status === 404) return 'O registro solicitado não foi encontrado.';
  if (status === 409) {
    return 'Não foi possível concluir a operação porque há dados duplicados ou relacionados.';
  }
  if (status >= 500) {
    return 'Não foi possível concluir a solicitação. Tente novamente em instantes e verifique se o serviço da API está disponível.';
  }
  return 'Não foi possível concluir a solicitação. Tente novamente.';
}

function toFriendlyMessage(status: number, message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('already exists')) {
    return 'Já existe um registro com esses dados.';
  }
  if (normalized.includes('not found')) {
    return 'O registro solicitado não foi encontrado.';
  }
  if (
    normalized.includes('cannot be deleted') ||
    normalized.includes('cannot delete') ||
    normalized.includes('related data') ||
    normalized.includes('associated data')
  ) {
    return 'Não é possível excluir este registro porque há dados relacionados.';
  }
  if (
    /[ãõáéíóúç]/i.test(message) ||
    /\b(não|nao|já|ja|obrigatório|inválido)\b/i.test(message)
  ) {
    return message;
  }

  return fallbackMessage(status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // non-JSON error body
    }
    throw toApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};
