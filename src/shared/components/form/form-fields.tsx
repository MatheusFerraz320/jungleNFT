import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';

export const controlClass =
  'border-line focus-visible:ring-ring placeholder:text-[#b39463] aria-[invalid=true]:border-destructive h-10 w-full rounded border bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:outline-none';

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: FieldError;
  children: ReactNode;
  /** Mantém o espaço do rótulo sem exibi-lo (alinhamento de grade). */
  hideLabel?: boolean;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  children,
  hideLabel,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label
        htmlFor={htmlFor}
        className={cn('mb-2 text-[15px] leading-4', hideLabel && 'max-sm:sr-only sm:invisible')}
      >
        {label}
        {required ? (
          <span
            aria-hidden="true"
            className="text-destructive ml-0.5 align-middle text-[22px] leading-none"
          >
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-destructive mt-1 text-xs">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

interface ControlProps {
  id: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  placeholder?: string;
  className?: string;
}

export function TextInput({
  id,
  register,
  error,
  placeholder,
  type = 'text',
  className,
}: ControlProps & { type?: string }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(controlClass, className)}
      {...register}
    />
  );
}

export function PasswordInput({ id, register, error, placeholder, className }: ControlProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlClass, 'pr-10', className)}
        {...register}
      />
      <button
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="text-primary/60 hover:text-primary focus-visible:ring-ring absolute top-1/2 right-3 -translate-y-1/2 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        {visible ? (
          <Eye aria-hidden="true" className="size-[18px]" />
        ) : (
          <EyeOff aria-hidden="true" className="size-[18px]" />
        )}
      </button>
    </div>
  );
}

export function SelectInput({
  id,
  register,
  error,
  placeholder,
  options,
  className,
}: ControlProps & { options: { value: string; label: string }[] }) {
  return (
    <div className={cn('relative', className)}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        defaultValue=""
        className={cn(
          controlClass,
          'cursor-pointer appearance-none pr-9 has-[option[value=""]:checked]:text-[#b39463] [&>option]:bg-[#241612] [&>option]:text-[#f5f1eb]',
        )}
        {...register}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}
