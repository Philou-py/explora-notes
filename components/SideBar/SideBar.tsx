import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";
import Avatar from "@/components/Avatar";
import SignOutButton from "@/app/@auth/SignOutButton";
import TeacherMenu, { Teacher } from "./TeacherMenu";
import StudentMenu, { Student } from "./StudentMenu";

let cx = cn.bind(sideBarStyles);

interface SideBarProps {
  accountType: "student" | "teacher";
  currentUser: Student | Teacher;
}

export default async function SideBar({ accountType, currentUser }: SideBarProps) {
  return (
    <div className={cn(cx("content"), "noprint")}>
      {currentUser && (
        <>
          <Avatar
            type="initials-avatar"
            className={sideBarStyles.avatar}
            initials={currentUser.displayName
              .split(" ")
              .map((part: string) => (part[0] ? part[0].toUpperCase() : ""))
              .join("")}
            borderColour="#33c9ff"
            size={150}
          />
          {accountType === "student" ? (
            <StudentMenu student={currentUser as Student} />
          ) : (
            <TeacherMenu teacher={currentUser as Teacher} />
          )}
          <SignOutButton />
        </>
      )}
    </div>
  );
}
