"use client";

import { createContext, useState, ReactNode } from "react";

interface SideBarProviderProps {
  children: ReactNode;
  clippedSideBar: boolean;
}

export const SideBarContext = createContext({
  clippedSideBar: false,
  sideBarOpen: false,
  setSideBarOpen: (_: boolean | ((_: boolean) => boolean)) => {},
});

export default function SideBarProvider({ clippedSideBar, children }: SideBarProviderProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);

  return (
    <SideBarContext.Provider value={{ clippedSideBar, sideBarOpen, setSideBarOpen }}>
      {children}
    </SideBarContext.Provider>
  );
}
