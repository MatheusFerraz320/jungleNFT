import type { ApiFieldError } from '@/shared/contracts';

/** Erro de negócio da API simulada; os handlers o convertem no envelope `ApiErrorResponse`. */
export class DomainError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: ApiFieldError[],
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
