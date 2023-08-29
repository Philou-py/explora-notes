"use client";

import { createContext, useState, ReactNode, useEffect } from "react";
import Dialog from "@/components/Dialog";
import CreateGroupForm from "@/app/teacher/group/CreateGroupForm";

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
  cGDialogOpen: false,
  setCGDialogOpen: (_: boolean | ((_: boolean) => boolean)) => {},
});

export default function SideBarProvider({
  clippedSideBar,
  openByDefault,
  isAuthenticated,
  children,
}: SideBarProviderProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [cGDialogOpen, setCGDialogOpen] = useState(false);

  // Open the SideBar by default, if authenticated and on a large screen
  useEffect(() => {
    if (openByDefault && isAuthenticated) {
      const mql = window.matchMedia("(max-width: 960px)");
      if (!mql.matches) setSideBarOpen(true);
    }
  }, [isAuthenticated, openByDefault]);

  return (
    <SideBarContext.Provider
      value={{ clippedSideBar, sideBarOpen, setSideBarOpen, cGDialogOpen, setCGDialogOpen }}
    >
      <Dialog showDialog={cGDialogOpen}>
        <CreateGroupForm closeDialog={() => setCGDialogOpen(false)} />
      </Dialog>
      {children}
    </SideBarContext.Provider>
  );
}
