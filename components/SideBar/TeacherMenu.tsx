"use client";

import cn from "classnames/bind";
import sideBarStyles from "./SideBar.module.scss";
import Button from "../Button";
import ButtonGroup from "./ButtonGroup";
import { usePathname } from "next/navigation";

const cx = cn.bind(sideBarStyles);

interface Teacher {
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

export default function TeacherMenu({ teacher: { evalTemplates, groups } }: { teacher: Teacher }) {
  const pathname = usePathname();

  return (
    <div className={cx("teacherMenu")}>
      <ButtonGroup
        triggerText="Créer un barème"
        triggerProps={{ className: "purple--text text--lighten-2" }}
      >
        <ButtonGroup
          triggerText="À partir d&rsquo;un modèle"
          triggerProps={{ className: "purple--text text--lighten-2" }}
        >
          {evalTemplates.map(({ templateId, title }) => (
            <Button
              key={templateId}
              className="red--text text--lighten-2"
              type="text"
              justifyContent="flex-start"
              isFullWidth
            >
              {title}
            </Button>
          ))}
        </ButtonGroup>

        <Button
          className="red--text text--lighten-2"
          type="text"
          justifyContent="flex-start"
          isFullWidth
        >
          Gestion des modèles
        </Button>
      </ButtonGroup>

      {groups.map(({ groupId, name, evaluations }) => (
        <ButtonGroup
          key={groupId}
          triggerText={name}
          triggerProps={{ className: "purple--text text--lighten-2" }}
        >
          <ButtonGroup
            triggerText="Évaluations"
            triggerProps={{ className: "purple--text text--lighten-2" }}
          >
            {evaluations.map(({ evalId, title }) => (
              <Button
                key={evalId}
                className="red--text text--lighten-2"
                type="text"
                justifyContent="flex-start"
                isFullWidth
              >
                {title}
              </Button>
            ))}
          </ButtonGroup>

          <Button
            className="red--text text--lighten-2"
            type="text"
            justifyContent="flex-start"
            isFullWidth
          >
            Synthèse des notes
          </Button>

          <Button
            className={
              pathname === `/teacher/group/${groupId}`
                ? "red lighten-2"
                : "red--text text--lighten-2"
            }
            type={pathname === `/teacher/group/${groupId}` ? "filled" : "text"}
            justifyContent="flex-start"
            href={`/teacher/group/${groupId}`}
            isFullWidth
            isLink
          >
            Administration
          </Button>
        </ButtonGroup>
      ))}

      <Button
        className={
          pathname === "/group-actions/create-group" ? "red lighten-2" : "red--text text--lighten-2"
        }
        type={pathname === "/group-actions/create-group" ? "filled" : "text"}
        justifyContent="flex-start"
        href="/group-actions/create-group"
        isFullWidth
        isLink
      >
        Créer un groupe
      </Button>
    </div>
  );
}
