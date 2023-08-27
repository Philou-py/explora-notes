"use client";

import { createContext, useState, ReactNode, useEffect } from "react";

interface SideBarProviderProps {
  children: ReactNode;
  clippedSideBar: boolean;
  openByDefault: boolean;
}

export const SideBarContext = createContext({
  clippedSideBar: false,
  sideBarOpen: false,
  setSideBarOpen: (_: boolean | ((_: boolean) => boolean)) => {},
});

export default function SideBarProvider({
  clippedSideBar,
  openByDefault,
  children,
}: SideBarProviderProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);

  // Open the SideBar by default only on large screens
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 960px)");
    if (openByDefault && !mql.matches) setSideBarOpen(true);
  }, [openByDefault]);

  return (
    <SideBarContext.Provider value={{ clippedSideBar, sideBarOpen, setSideBarOpen }}>
      {children}
    </SideBarContext.Provider>
  );
}
