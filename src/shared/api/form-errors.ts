import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { normalizeApiError } from './errors';

/**
 * Projeta `fieldErrors` da API nos campos do formulário. Devolve a mensagem geral quando o erro
 * não é atribuível a um campo (ex.: credenciais inválidas, falha de rede).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  /** Nome do campo na API → nome do campo no formulário (quando diferem). */
  aliases: Record<string, Path<T>> = {},
): string | null {
  const apiError = normalizeApiError(error);
  let mapped = false;

  for (const fieldError of apiError.fieldErrors ?? []) {
    const field = aliases[fieldError.field] ?? fields.find((name) => name === fieldError.field);
    if (field) {
      setError(field, { type: 'server', message: fieldError.message });
      mapped = true;
    }
  }

  return mapped ? null : apiError.message;
}
