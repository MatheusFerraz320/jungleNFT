import { HttpResponse, type JsonBodyType } from 'msw';
import { mockDomain } from '@/mocks/db/domain';
import { DomainError } from '@/mocks/db/domain-error';
import { isOfflineScenario, waitForScenario } from './scenario';
import { consumeFault } from './faults';

export interface RouteContext {
  request: Request;
  params: Record<string, string | readonly string[] | undefined>;
  token: string | null;
  guestId: string | null;
  idempotencyKey: string | null;
  json: () => Promise<unknown>;
}

export interface RouteResult {
  status?: number;
  body?: JsonBodyType;
  headers?: Record<string, string>;
}

function errorResponse(error: DomainError) {
  return HttpResponse.json(
    {
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
      requestId: crypto.randomUUID(),
    },
    { status: error.status },
  );
}

/**
 * Pipeline comum dos handlers: conexão (cenário offline), falhas injetadas, latência do cenário
 * e conversão de `DomainError` no envelope `ApiErrorResponse`.
 */
export async function respond(
  info: { request: Request; params: RouteContext['params'] },
  fn: (context: RouteContext) => Promise<RouteResult | undefined> | RouteResult | undefined,
) {
  const { request, params } = info;
  if (isOfflineScenario()) return HttpResponse.error();

  const url = new URL(request.url);
  const fault = consumeFault(request.method, url.pathname);
  await waitForScenario();

  if (fault) {
    return HttpResponse.json(
      {
        code: fault.status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
        message: 'Falha simulada pelo ambiente de testes.',
      },
      { status: fault.status },
    );
  }

  const authorization = request.headers.get('authorization');
  const context: RouteContext = {
    request,
    params,
    token: authorization?.startsWith('Bearer ') ? authorization.slice(7) : null,
    guestId: request.headers.get('x-guest-id'),
    idempotencyKey: request.headers.get('idempotency-key'),
    json: async () => {
      try {
        return await request.clone().json();
      } catch {
        throw new DomainError(400, 'VALIDATION_ERROR', 'Corpo da requisição inválido.');
      }
    },
  };

  try {
    await mockDomain.ensureReady();
    const result = (await fn(context)) ?? { status: 204 };

    if (result.status === 204) return new HttpResponse(null, { status: 204 });
    return HttpResponse.json(result.body, {
      status: result.status ?? 200,
      headers: result.headers,
    });
  } catch (error) {
    if (error instanceof DomainError) return errorResponse(error);
    throw error;
  }
}

export function param(value: string | readonly string[] | undefined) {
  return Array.isArray(value) ? String(value[0]) : String(value);
}
