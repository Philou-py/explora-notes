import { DGRAPH_URL } from "@/config";
import groupAdminStyles from "./GroupAdmin.module.scss";
import cn from "classnames/bind";
import AddStudents from "./AddStudents";
import StudentsTable from "./StudentsTable";

const cx = cn.bind(groupAdminStyles);

interface GroupStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentAccount?: {
    username: string;
  };
}

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      groupStudents {
        id
        firstName
        lastName
        studentAccount {
          username
        }
      }
    }
  }
`;

async function getGroupStudents(groupId: string): Promise<GroupStudent[]> {
  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_GROUP,
      variables: { groupId },
    }),
    next: { tags: ["getGroupStudents"] },
  });
  const result = await dgraphRes.json();
  const groupStudents: GroupStudent[] = result.data.getGroup.groupStudents;
  return groupStudents;
}

export default async function Page({ params: { groupId } }: { params: { groupId: string } }) {
  const groupStudents = await getGroupStudents(groupId);

  return (
    <>
      <AddStudents />
      <StudentsTable groupStudents={groupStudents} />
    </>
  );
}
