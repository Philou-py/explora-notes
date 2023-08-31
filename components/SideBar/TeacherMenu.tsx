"use client";

import { useContext } from "react";
import cn from "classnames/bind";
import sideBarStyles from "./SideBar.module.scss";
import Button from "../Button";
import ButtonGroup from "./ButtonGroup";
import { usePathname } from "next/navigation";
import { SideBarContext } from "@/contexts/SideBarContext";

const cx = cn.bind(sideBarStyles);

export interface Teacher {
  email: string;
  displayName: string;
  evalTemplates: {
    templateId: string;
    title: string;
  }[];
  groups: {
    groupId: string;
    name: string;
    evaluations: {
      evalId: string;
      title: string;
    }[];
  }[];
}

export default function TeacherMenu({
  teacher: { email, evalTemplates, groups },
}: {
  teacher: Teacher;
}) {
  const pathname = usePathname();
  const { cGDialogOpen, setCGDialogOpen, cEDialogOpen, createEvalTemplate, getPrefillInfo } =
    useContext(SideBarContext);

  const teacherMenuTemplate = (
    <>
      <div className={cx("teacherMenu")}>
        <Button className="indigo--text" type="text" justifyContent="flex-start" isFullWidth>
          Gestion des modèles
        </Button>

        {groups.map(({ groupId, name, evaluations }) => (
          <ButtonGroup
            key={groupId}
            triggerText={name}
            triggerProps={{ className: "indigo--text" }}
          >
            <ButtonGroup
              triggerText="Créer un barème"
              triggerProps={{ className: "purple--text" }}
              openByDefault={false}
            >
              {evalTemplates.map(({ templateId, title }) => (
                <Button
                  key={templateId}
                  className={
                    createEvalTemplate &&
                    createEvalTemplate.id === templateId &&
                    createEvalTemplate.groupName === name
                      ? "deep-orange darken-3"
                      : "deep-orange--text text--darken-3"
                  }
                  type={
                    createEvalTemplate &&
                    createEvalTemplate.id === templateId &&
                    createEvalTemplate.groupName === name
                      ? "filled"
                      : "text"
                  }
                  justifyContent="flex-start"
                  onClick={() => {
                    getPrefillInfo(email, templateId, name, groupId);
                  }}
                  isFullWidth
                >
                  {title}
                </Button>
              ))}
            </ButtonGroup>

            <ButtonGroup triggerText="Évaluations" triggerProps={{ className: "purple--text" }}>
              {evaluations.map(({ evalId, title }) => (
                <Button
                  key={evalId}
                  className="deep-orange--text text--darken-3"
                  type="text"
                  justifyContent="flex-start"
                  isFullWidth
                >
                  {title}
                </Button>
              ))}
            </ButtonGroup>

            <Button className="purple--text" type="text" justifyContent="flex-start" isFullWidth>
              Synthèse des notes
            </Button>

            <Button
              className={
                pathname === `/teacher/${email}/group/${groupId}/admin` &&
                !cGDialogOpen &&
                !cEDialogOpen
                  ? "purple white--text"
                  : "purple--text"
              }
              type={pathname === `/teacher/${email}/group/${groupId}/admin` ? "filled" : "text"}
              justifyContent="flex-start"
              href={`/teacher/${email}/group/${groupId}/admin`}
              isFullWidth
              isLink
            >
              Administration
            </Button>
          </ButtonGroup>
        ))}

        <Button
          className={cGDialogOpen ? "indigo white--text" : "indigo--text"}
          type={cGDialogOpen ? "filled" : "text"}
          justifyContent="flex-start"
          onClick={() => setCGDialogOpen(true)}
          isFullWidth
        >
          Créer un groupe
        </Button>
      </div>
    </>
  );
  return teacherMenuTemplate;
}
