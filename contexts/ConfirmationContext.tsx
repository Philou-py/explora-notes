"use client";

import { createContext, useState, ReactNode, useCallback } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";

interface ConfirmationProviderProps {
  children: ReactNode;
}

export const ConfirmationContext = createContext<
  (msg: string, ...submitArgs: [string, string, object]) => void
>(() => {});

type SubmitArgs = [string, string, object];

export default function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [submitArgs, setSubmitArgs] = useState<SubmitArgs>(["", "", {}]);

  const promptConfirmation = useCallback((msg: string, ...submitArgs: SubmitArgs) => {
    setMessage(msg);
    setSubmitArgs(submitArgs);
    setShowDialog(true);
  }, []);

  return (
    <ConfirmationContext.Provider value={promptConfirmation}>
      <ConfirmationDialog
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        msg={message}
        submitArgs={submitArgs}
      />
      {children}
    </ConfirmationContext.Provider>
  );
}
