import { DGRAPH_URL } from "@/config";
import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import Container from "@/components/Container";
import groupLayoutStyles from "./layout.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(groupLayoutStyles);

const publicKey = readFileSync("public.key");

interface Group {
  id: string;
  name: string;
  schoolYear: number;
  level: string;
  subject: string;
  teacher: {
    email: string;
  };
  groupStudents: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    studentAccount?: {
      username: string;
    };
  }[];
}

function getTeacherEmail() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) notFound();
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "student") notFound();
  return payload.email;
}

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      id
      name
      schoolYear
      level
      subject
      teacher {
        email
      }
      groupStudents {
        id
        firstName
        lastName
        fullName
        studentAccount {
          username
        }
      }
    }
  }
`;

async function getGroup(groupId: string, teacherEmail: string): Promise<Group> {
  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_GROUP,
      variables: { groupId },
    }),
  });
  const result = await dgraphRes.json();
  const group: Group = result.data.getGroup;
  if (group.teacher.email !== teacherEmail) notFound();
  return group;
}

interface LayoutProps {
  children: ReactNode;
  params: { groupId: string };
}

export default async function Layout({ children, params: { groupId } }: LayoutProps) {
  const teacherEmail = getTeacherEmail();
  const group = await getGroup(groupId, teacherEmail);
  return (
    <Container className={cx("groupLayout")}>
      <h1>{group.name}</h1>
      <h2>
        {group.subject} - {group.level} - {group.schoolYear}/{group.schoolYear + 1}
      </h2>
      {children}
    </Container>
  );
}
