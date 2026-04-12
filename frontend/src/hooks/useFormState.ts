import { useState, useCallback } from "react";

interface UseFormStateReturn<T> {
  readonly values: T;
  readonly errors: Partial<Record<keyof T, string>>;
  readonly setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  readonly setFieldError: <K extends keyof T>(field: K, error: string) => void;
  readonly clearErrors: () => void;
  readonly resetForm: (initialValues: T) => void;
  readonly isDirty: boolean;
}

export function useFormState<T extends Record<string, any>>(
  initialValues: T
): UseFormStateReturn<T> {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [originalValues] = useState(initialValues);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback((newInitialValues: T) => {
    setValues(newInitialValues);
    setErrors({});
  }, []);

  const isDirty = JSON.stringify(values) !== JSON.stringify(originalValues);

  return {
    values,
    errors,
    setFieldValue,
    setFieldError,
    clearErrors,
    resetForm,
    isDirty,
  };
}
