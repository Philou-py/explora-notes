import Link from "next/link";
import { cookies } from "next/headers";
import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";
import Container from "@/components/Container";
import Avatar from "@/components/Avatar";
import SignOutButton from "@/app/@auth/SignOutButton";
import { verify } from "jsonwebtoken";
import { dgraphQuery } from "@/app/dgraphQuery";
import { readFileSync } from "fs";
import TeacherMenu from "./TeacherMenu";
import StudentMenu from "./StudentMenu";

let cx = cn.bind(sideBarStyles);

const publicKey = readFileSync("public.key");

const GET_STUDENT = `
  query GetStudent($email: String!) {
    getUser: getStudent(email: $email) {
      email
      displayName: username
      groups: groupStudents {
        groups: group {
          id
          name
        }
      }
    }
  }
`;

const GET_TEACHER = `
  query GetTeacher($email: String!) {
    getUser: getTeacher(email: $email) {
      email
      displayName: fullName
      evalTemplates {
        templateId: id
        title
      }
      groups {
        groupId: id
        name
        evaluations {
          evalId: id
          title
        }
      }
    }
  }
`;

async function getCurrentUser() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) return {};
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object") return {};

  const { email, accountType } = payload;
  const user = await dgraphQuery(
    accountType === "student" ? GET_STUDENT : GET_TEACHER,
    { email },
    "getUser"
  );
  if (!user) return {};
  return { accountType, currentUser: user };
}

interface SideBarProps {}

export default async function SideBar({}: SideBarProps) {
  const { accountType, currentUser } = await getCurrentUser();

  return (
    <div className={cx("content")}>
      {currentUser && (
        <>
          <Avatar
            type="initials-avatar"
            className={sideBarStyles.avatar}
            initials={currentUser!.displayName
              .split(" ")
              .map((part: string) => part[0].toUpperCase())
              .join("")}
            borderColour="#33c9ff"
            size={150}
          />
          {accountType === "student" ? (
            <StudentMenu student={currentUser} />
          ) : (
            <TeacherMenu teacher={currentUser} />
          )}
          <SignOutButton />
        </>
      )}
    </div>
  );
}
