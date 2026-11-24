import { isAxiosError } from 'axios';
import { ApiErrorResponseSchema, type ApiErrorResponse } from '@/shared/contracts';

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

const statusToCode: Record<number, ApiErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  502: 'INTERNAL_ERROR',
  503: 'INTERNAL_ERROR',
  504: 'TIMEOUT',
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fieldErrors: ApiErrorResponse['fieldErrors'];
  readonly requestId?: string;

  constructor(params: {
    message: string;
    status?: number;
    code?: ApiErrorCode;
    fieldErrors?: ApiErrorResponse['fieldErrors'];
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status ?? 0;
    this.code = params.code ?? statusToCode[this.status] ?? 'UNKNOWN_ERROR';
    this.fieldErrors = params.fieldErrors;
    this.requestId = params.requestId;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const payload = ApiErrorResponseSchema.safeParse(error.response?.data);
    const requestId = error.response?.headers['x-request-id'];

    return new ApiError({
      message:
        payload.success && payload.data.message
          ? payload.data.message
          : error.message || 'Não foi possível concluir a operação.',
      status: error.response?.status,
      code: payload.success
        ? (payload.data.code as ApiErrorCode)
        : error.code === 'ECONNABORTED'
          ? 'TIMEOUT'
          : error.code === 'ERR_NETWORK'
            ? 'NETWORK_ERROR'
            : undefined,
      fieldErrors: payload.success ? payload.data.fieldErrors : undefined,
      requestId: typeof requestId === 'string' ? requestId : undefined,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message });
  }

  return new ApiError({ message: 'Ocorreu um erro inesperado.' });
}

export function getErrorMessage(error: unknown) {
  return normalizeApiError(error).message;
}
