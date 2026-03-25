'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={clsx(
            'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-red-600" role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
