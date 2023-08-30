import { DGRAPH_URL } from "@/config";
import Container from "@/components/Container";
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

interface Group {
  name: string;
  schoolYear: number;
  level: string;
  subject: string;
  groupStudents: GroupStudent[];
}

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      name
      schoolYear
      level
      subject
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

async function getGroup(groupId: string): Promise<Group> {
  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_GROUP,
      variables: { groupId },
    }),
    next: { tags: ["getGroup-" + groupId] },
  });
  const result = await dgraphRes.json();
  // console.log("getGroup", groupId, result.extensions.tracing.startTime);
  const group: Group = result.data.getGroup;
  return group;
}

export default async function Page({ params: { groupId } }: { params: { groupId: string } }) {
  const group = await getGroup(groupId);

  return (
    <Container className={cx("groupAdmin")}>
      <h1>{group.name}</h1>
      <h2>
        {group.subject} - {group.level} - {group.schoolYear}/{group.schoolYear + 1}
      </h2>
      <AddStudents />
      <StudentsTable groupStudents={group.groupStudents} />
    </Container>
  );
}
