"use client";

import { usePathname } from "next/navigation";
import cn from "classnames/bind";
import sideBarStyles from "./SideBar.module.scss";
import Button from "../Button";
import ButtonGroup from "./ButtonGroup";
import { useContext } from "react";
import { SideBarContext } from "@/contexts/SideBarContext";

const cx = cn.bind(sideBarStyles);

export interface Student {
  email: string;
  displayName: string;
  groupStudents: {
    group: {
      groupId: string;
      name: string;
    };
    copies: {
      copyId: string;
      evaluation: { title: string; isPublished: boolean };
    }[];
  }[];
}

export default function StudentMenu({ student }: { student: Student }) {
  const pathname = usePathname();
  const colours = {
    level1: ["indigo--text text--darken-2", "indigo darken-2 white--text"],
    level2: ["purple--text", "purple white--text"],
    level3: ["deep-orange--text text--darken-3", "deep-orange darken-3"],
  };

  const { jGDialogOpen, setJGDialogOpen } = useContext(SideBarContext);
  const areDialogsOpen = jGDialogOpen;

  const studentMenuTemplate = (
    <>
      <div className={cx("studentMenu")}>
        {student.groupStudents.map(({ group: { groupId, name }, copies }) => (
          <ButtonGroup
            key={groupId}
            triggerText={name}
            triggerProps={{ className: colours.level1[0] }}
          >
            <ButtonGroup triggerText="Copies" triggerProps={{ className: colours.level2[0] }}>
              {copies.map(
                ({ copyId, evaluation: { title, isPublished } }) =>
                  isPublished && (
                    <Button
                      key={copyId}
                      className={
                        !areDialogsOpen && pathname === `/student/${student.email}/copies/${copyId}`
                          ? colours.level3[1]
                          : colours.level3[0]
                      }
                      type="text"
                      justifyContent="flex-start"
                      href={`/student/${student.email}/copies/${copyId}`}
                      isFullWidth
                      isLink
                    >
                      {title}
                    </Button>
                  )
              )}
            </ButtonGroup>
          </ButtonGroup>
        ))}

        <Button
          className={jGDialogOpen ? colours.level1[1] : colours.level1[0]}
          type={jGDialogOpen ? "filled" : "text"}
          justifyContent="flex-start"
          onClick={() => setJGDialogOpen(true)}
          isFullWidth
        >
          Rejoindre un groupe
        </Button>
      </div>
    </>
  );
  return studentMenuTemplate;
}
