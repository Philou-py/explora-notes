import { ReactNode } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import Footer from "@/components/Footer";
import Main from "@/app/Main";
import SideBarProvider from "@/contexts/SideBarContext";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import SideBarWrapper from "@/components/SideBar/SideBarWrapper";
import { dgraphQuery } from "@/app/dgraphQuery";

export const metadata: Metadata = {
  title: "ExploraNotes - Professeur",
};

const publicKey = readFileSync("public.key");

function checkTeacherEmail(teacherEmail: string) {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) notFound();
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "student") notFound();

  const currentUserEmail = payload.email;
  if (currentUserEmail !== teacherEmail) notFound();
}

const GET_TEACHER = `
  query GetTeacher($email: String!) {
    getTeacher(email: $email) {
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

async function getCurrentUser(userEmail: string) {
  const user = await dgraphQuery(
    GET_TEACHER,
    { email: userEmail },
    "getTeacher",
    "getTeacher-" + userEmail
  );
  return user || null;
}

interface Props {
  nav: ReactNode;
  children: ReactNode;
  params: { teacherEmail: string };
}

export default async function TeacherLayout({ children, params: { teacherEmail } }: Props) {
  const decodedEmail = decodeURIComponent(teacherEmail);
  checkTeacherEmail(decodedEmail);
  const currentUser = await getCurrentUser(decodedEmail);

  return (
    <SideBarProvider clippedSideBar={true} openByDefault={true} isAuthenticated={true}>
      <NavBar accountType="teacher" currentUser={currentUser} />
      <SideBarWrapper>
        <SideBar accountType="teacher" currentUser={currentUser} />
      </SideBarWrapper>
      <Main>
        {children}
        <Footer />
      </Main>
    </SideBarProvider>
  );
}
