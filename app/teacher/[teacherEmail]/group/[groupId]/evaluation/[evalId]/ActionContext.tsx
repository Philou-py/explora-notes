"use client";

import { createContext, useCallback, useState } from "react";

const defaultAction = {
  type: "",
  info: {} as { [key: string]: string },
};

export const ActionContext = createContext({
  action: defaultAction,
  setAction: (_: typeof defaultAction) => {},
  resetAction: () => {},
});

export default function ActionContextProvider({ children }) {
  const [action, setAction] = useState(defaultAction);
  const resetAction = useCallback(() => setAction(defaultAction), []);
  return (
    <ActionContext.Provider value={{ action, setAction, resetAction }}>
      {children}
    </ActionContext.Provider>
  );
}
