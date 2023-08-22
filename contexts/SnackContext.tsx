"use client";

import { createContext, useState, useEffect, ReactNode, useCallback, ReactElement } from "react";
import { SnackBar } from "../components";

interface SnackProviderProps {
  children: ReactNode;
}

type SnackBarType = "success" | "info" | "error";

export const SnackContext = createContext<{
  haveASnack: (type: SnackBarType, content: ReactElement, timeout?: number) => void;
}>({
  haveASnack: () => {},
});

export default function SnackProvider({ children }: SnackProviderProps) {
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarType, setSnackBarType] = useState<SnackBarType>("success");
  const [snackTimeout, setSnackTimeout] = useState(5000);
  const [snackBarContent, setSnackBarContent] = useState(<h4>Hello, world!</h4>);

  useEffect(() => {
    if (showSnackBar) {
      setTimeout(() => {
        setShowSnackBar(false);
      }, snackTimeout);
    }
  }, [showSnackBar, snackTimeout]);

  const haveASnack = useCallback((type: SnackBarType, content: ReactElement, timeout?: number) => {
    setSnackBarType(type);
    setSnackTimeout(timeout || 5000);
    setSnackBarContent(content);
    setShowSnackBar(true);
  }, []);

  return (
    <SnackContext.Provider value={{ haveASnack }}>
      <SnackBar showSnackBar={showSnackBar} snackBarType={snackBarType}>
        {snackBarContent}
      </SnackBar>
      {children}
    </SnackContext.Provider>
  );
}
