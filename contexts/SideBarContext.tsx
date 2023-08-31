"use client";

import { createContext, useState, ReactNode, useEffect, useCallback } from "react";
import Dialog from "@/components/Dialog";
import CreateGroupForm from "@/app/teacher/[teacherEmail]/group/CreateGroupForm";
import CreateEvalForm from "@/app/teacher/[teacherEmail]/group/[groupId]/evaluation/CreateEvalForm";
import { EvalTemplate } from "@/app/teacher/[teacherEmail]/template/[templateId]/get-template/route";

async function fetchTemplate(url: string): Promise<EvalTemplate> {
  const response = await fetch(url);
  const result = await response.json();
  return result.template;
}

interface SideBarProviderProps {
  children: ReactNode;
  clippedSideBar: boolean;
  openByDefault: boolean;
  isAuthenticated: boolean;
}

type Modify<T, R> = Omit<T, keyof R> & R;

export interface TemplateForGr
  extends Modify<
    EvalTemplate,
    {
      markPrecision: string;
      coefficient: string;
    }
  > {
  groupId: string;
  groupName: string;
}

export const SideBarContext = createContext({
  clippedSideBar: false,
  sideBarOpen: false,
  setSideBarOpen: (_: boolean | ((_: boolean) => boolean)) => {},
  cGDialogOpen: false,
  setCGDialogOpen: (_: boolean | ((_: boolean) => boolean)) => {},
  cEDialogOpen: false,
  setCEDialogOpen: (_: boolean | ((_: boolean) => boolean)) => {},
  createEvalTemplate: null as TemplateForGr | null,
  setCreateEvalTemplate: (_: TemplateForGr | null) => {},
  getPrefillInfo: (_: string, __: string, ___: string, ____: string) => {},
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
    setCreateEvalTemplate(null);
  }, []);
  const [createEvalTemplate, setCreateEvalTemplate] = useState<TemplateForGr>(null);
  const getPrefillInfo = useCallback(
    async (teacherEmail: string, templateId: string, groupName: string, groupId: string) => {
      const template = await fetchTemplate(
        `/teacher/${teacherEmail}/template/${templateId}/get-template`
      );
      template.categories.sort((a, b) => a.rank - b.rank);
      setCreateEvalTemplate({
        ...template,
        groupId: groupId,
        groupName,
        markPrecision: template.markPrecision.toString(),
        coefficient: template.coefficient.toString(),
      });
    },
    []
  );

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
        createEvalTemplate,
        setCreateEvalTemplate,
        getPrefillInfo,
      }}
    >
      <Dialog showDialog={cGDialogOpen}>
        <CreateGroupForm closeDialog={closeCGDialog} />
      </Dialog>
      <Dialog showDialog={cEDialogOpen}>
        <CreateEvalForm closeDialog={closeCEDialog} />
      </Dialog>
      {children}
    </SideBarContext.Provider>
  );
}
