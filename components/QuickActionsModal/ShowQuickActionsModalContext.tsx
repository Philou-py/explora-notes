"use client";

import { createContext } from "react";

export const ShowQuickActionsModalContext = createContext({
  showQuickActionsModal: false,
  setShowQuickActionsModal: (_: boolean) => {},
});

export default function ShowQuickActionsModalProvider({
  showQuickActionsModal,
  setShowQuickActionsModal,
  children,
}) {
  return (
    <ShowQuickActionsModalContext.Provider
      value={{ showQuickActionsModal, setShowQuickActionsModal }}
    >
      {children}
    </ShowQuickActionsModalContext.Provider>
  );
}
