"use client";

import { createContext, useState, ReactNode, useEffect } from "react";

interface SideBarProviderProps {
  children: ReactNode;
  clippedSideBar: boolean;
  openByDefault: boolean;
  isAuthenticated: boolean;
}

export const SideBarContext = createContext({
  clippedSideBar: false,
  sideBarOpen: false,
  setSideBarOpen: (_: boolean | ((_: boolean) => boolean)) => {},
});

export default function SideBarProvider({
  clippedSideBar,
  openByDefault,
  isAuthenticated,
  children,
}: SideBarProviderProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);

  // Open the SideBar by default, if authenticated and on a large screen
  useEffect(() => {
    if (openByDefault && isAuthenticated) {
      const mql = window.matchMedia("(max-width: 960px)");
      if (!mql.matches) setSideBarOpen(true);
    }
  }, [isAuthenticated, openByDefault]);

  return (
    <SideBarContext.Provider value={{ clippedSideBar, sideBarOpen, setSideBarOpen }}>
      {children}
    </SideBarContext.Provider>
  );
}
