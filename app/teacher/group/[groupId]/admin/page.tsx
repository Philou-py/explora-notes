import { DGRAPH_URL } from "@/config";
import groupAdminStyles from "./GroupAdmin.module.scss";
import cn from "classnames/bind";
import DataTable, { TableHeader } from "@/components/DataTable";
import AddStudents from "./AddStudents";

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

  const studentsTableHeaders: TableHeader[] = [
    { text: "Prénom", value: "firstName" },
    { text: "Nom de famille", value: "lastName" },
  ];

  const studentsTableItems = groupStudents.map((groupStudent) => ({
    key: { rawContent: groupStudent.id },
    firstName: { rawContent: groupStudent.firstName },
    lastName: { rawContent: groupStudent.lastName },
  }));

  return (
    <>
      <AddStudents groupId={groupId} />
      <DataTable
        headers={studentsTableHeaders}
        items={studentsTableItems}
        sortBy="lastName"
        lineNumbering
      />
    </>
  );
}
