"use client";

import { createContext, useState, ReactNode, useEffect, useCallback } from "react";
import Dialog from "@/components/Dialog";
import CreateGroupForm from "@/app/teacher/[teacherEmail]/group/CreateGroupForm";
import CreateEvalForm from "@/app/teacher/[teacherEmail]/group/[groupId]/evaluation/CreateEvalForm";

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
  cEDialogOpen: false,
  setCEDialogOpen: (_: boolean | ((_: boolean) => boolean)) => {},
  createEvalInfo: { templateId: "", group: { id: "", name: "" } },
  setCreateEvalInfo: (_: { templateId: string; group: { id: string; name: string } }) => {},
});

export default function SideBarProvider({
  clippedSideBar,
  openByDefault,
  isAuthenticated,
  children,
}: SideBarProviderProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [cGDialogOpen, setCGDialogOpen] = useState(false);
  const closeCGDialog = useCallback(() => setCGDialogOpen(false), []);
  const [cEDialogOpen, setCEDialogOpen] = useState(false);
  const closeCEDialog = useCallback(() => {
    setCEDialogOpen(false);
    setCreateEvalInfo({
      templateId: "",
      group: { id: "", name: "" },
    });
  }, []);
  const [createEvalInfo, setCreateEvalInfo] = useState({
    templateId: "",
    group: { id: "", name: "" },
  });

  // Open the SideBar by default, if authenticated and on a large screen
  useEffect(() => {
    if (openByDefault && isAuthenticated) {
      const mql = window.matchMedia("(max-width: 960px)");
      if (!mql.matches) setSideBarOpen(true);
    }
  }, [isAuthenticated, openByDefault]);

  return (
    <SideBarContext.Provider
      value={{
        clippedSideBar,
        sideBarOpen,
        setSideBarOpen,
        cGDialogOpen,
        setCGDialogOpen,
        cEDialogOpen,
        setCEDialogOpen,
        createEvalInfo,
        setCreateEvalInfo,
      }}
    >
      <Dialog showDialog={cGDialogOpen}>
        <CreateGroupForm closeDialog={closeCGDialog} />
      </Dialog>
      <Dialog showDialog={cEDialogOpen}>
        <CreateEvalForm {...createEvalInfo} closeDialog={closeCEDialog} />
      </Dialog>
      {children}
    </SideBarContext.Provider>
  );
}
