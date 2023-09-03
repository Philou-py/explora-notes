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
import { DGRAPH_URL } from "@/config";

export const metadata: Metadata = {
  title: "ExploraNotes - Professeur",
};

const publicKey = readFileSync("public.key");

function checkTeacherEmail(studentEmail: string) {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) notFound();
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "teacher") notFound();

  const currentUserEmail = payload.email;
  if (currentUserEmail !== studentEmail) notFound();
}

const GET_STUDENT = `
  query ($email: String!) {
    getStudent(email: $email) {
      email
      displayName: username
      groupStudents {
        group {
          groupId: id
          name
        }
        copies {
          copyId: id
          evaluation {
            title
            isPublished
          }
        }
      }
    }
  }
`;

async function getCurrentUser(userEmail: string) {
  const dgraphResponse = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GET_STUDENT, variables: { email: userEmail } }),
    cache: "no-store",
  });

  const result = await dgraphResponse.json();
  const user = result.data.getStudent;
  return user || null;
}

interface Props {
  nav: ReactNode;
  children: ReactNode;
  params: { studentEmail: string };
}

export default async function TeacherLayout({ children, params: { studentEmail } }: Props) {
  const decodedEmail = decodeURIComponent(studentEmail);
  checkTeacherEmail(decodedEmail);
  const currentUser = await getCurrentUser(decodedEmail);

  return (
    <SideBarProvider clippedSideBar={true} openByDefault={true} isAuthenticated={true}>
      <NavBar accountType="student" currentUser={currentUser} />
      <SideBarWrapper>
        <SideBar accountType="student" currentUser={currentUser} />
      </SideBarWrapper>
      <Main>
        {children}
        <Footer />
      </Main>
    </SideBarProvider>
  );
}
