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
  const areDialogsOpen = cGDialogOpen || cEDialogOpen;
  const colours = {
    level1: ["indigo--text text--darken-2", "indigo darken-2 white--text"],
    level2: ["purple--text", "purple white--text"],
    level3: ["deep-orange--text text--darken-3", "deep-orange darken-3"],
  };

  const teacherMenuTemplate = (
    <>
      <div className={cx("teacherMenu")}>
        {groups.map(({ groupId, name, evaluations }) => (
          <ButtonGroup
            key={groupId}
            triggerText={name}
            triggerProps={{ className: colours.level1[0] }}
          >
            <ButtonGroup
              triggerText="Créer un barème"
              triggerProps={{ className: colours.level2[0] }}
              openByDefault={false}
            >
              {evalTemplates.map(({ templateId, title }) => (
                <Button
                  key={templateId}
                  className={
                    createEvalTemplate &&
                    createEvalTemplate.id === templateId &&
                    createEvalTemplate.groupName === name
                      ? colours.level3[1]
                      : colours.level3[0]
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

            <ButtonGroup triggerText="Évaluations" triggerProps={{ className: colours.level2[0] }}>
              {evaluations.map(({ evalId, title }) => (
                <Button
                  key={evalId}
                  className={
                    !areDialogsOpen &&
                    pathname === `/teacher/${email}/group/${groupId}/evaluation/${evalId}`
                      ? colours.level3[1]
                      : colours.level3[0]
                  }
                  type="text"
                  justifyContent="flex-start"
                  href={`/teacher/${email}/group/${groupId}/evaluation/${evalId}`}
                  isFullWidth
                  isLink
                >
                  {title}
                </Button>
              ))}
            </ButtonGroup>

            <Button
              className={
                !areDialogsOpen && pathname === `/teacher/${email}/group/${groupId}/admin`
                  ? colours.level2[1]
                  : colours.level2[0]
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
          className={cGDialogOpen ? colours.level1[1] : colours.level1[0]}
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
