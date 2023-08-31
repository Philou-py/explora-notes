"use client";

import { createContext, useState } from "react";

const defaultAction = {
  actionType: "",
  info: {} as { [key: string]: string },
};

export const ActionContext = createContext({
  action: defaultAction,
  setAction: (_: typeof defaultAction) => {},
});

export default function ActionContextProvider({ children }) {
  const [action, setAction] = useState(defaultAction);
  return <ActionContext.Provider value={{ action, setAction }}>{children}</ActionContext.Provider>;
}
