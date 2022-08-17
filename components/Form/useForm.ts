import { useState, useEffect, useCallback } from "react";

export default function useForm<T extends Record<string, string>>(initialData: T) {
  const [data, setData] = useState<typeof initialData>(initialData);
  const [isValid, setIsValid] = useState(false);
  const [fieldsValidity, setFieldsValidity] = useState({});

  useEffect(() => {
    setIsValid(!Object.values(fieldsValidity).includes(false));
  }, [fieldsValidity]);

  const useRegister = (
    fieldName: keyof T,
    value?: string | File,
    setValue?: (newValue: string | File) => void
  ) => {
    const setDataCb = useCallback(
      (newValue: string | File) => {
        setData((data) => ({ ...data, [fieldName]: newValue }));
      },
      [fieldName]
    );

    return {
      value: typeof window !== "undefined" && value instanceof File ? value.name : data[fieldName],
      setValue: setValue ? setValue : setDataCb,
      setFieldsValidity,
    };
  };

  return { data, setData, isValid, register: useRegister };
}
