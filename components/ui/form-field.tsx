import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      helperText,
      error,
      required,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
        {label && (
          <label
            htmlFor={htmlFor}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {required && (
              <span className="text-error-400 ml-0.5">*</span>
            )}
          </label>
        )}
        {children}
        {error ? (
          <p className="text-xs text-error-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField, type FormFieldProps };
