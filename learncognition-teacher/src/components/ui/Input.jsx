import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(function Input(
  { label, error, helper, className, ...props },
  ref,
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, helper, className, ...props },
  ref,
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, helper, children, className, ...props },
  ref,
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          error ? "border-red-400 bg-red-50" : "border-gray-300",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
});
