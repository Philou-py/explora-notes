import { DGRAPH_URL } from "@/config";
import { ReactNode } from "react";
import { notFound } from "next/navigation";

interface Group {
  teacher: {
    email: string;
  };
}

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      teacher {
        email
      }
    }
  }
`;

async function checkGroup(groupId: string, teacherEmail: string) {
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
  // console.log("checkGroup", result.extensions.tracing.startTime);
  const group: Group = result.data.getGroup;
  if (!group || group.teacher.email !== teacherEmail) notFound();
}

interface Props {
  children: ReactNode;
  params: { teacherEmail: string; groupId: string };
}

export default async function GroupLayout({ children, params: { teacherEmail, groupId } }: Props) {
  await checkGroup(groupId, decodeURIComponent(teacherEmail));
  return <>{children}</>;
}
