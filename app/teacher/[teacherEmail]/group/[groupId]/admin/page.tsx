import Container from "@/components/Container";
import groupAdminStyles from "./GroupAdmin.module.scss";
import cn from "classnames/bind";
import AddStudents from "./AddStudents";
import StudentsTable from "./StudentsTable";
import QRCodes from "./QRCodes";
import { dgraphQuery } from "@/app/dgraphQuery";

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
  return await dgraphQuery(GET_GROUP, { groupId }, "getGroup", "getGroup-" + groupId);
}

export default async function Page({ params: { groupId } }: { params: { groupId: string } }) {
  const group = await getGroup(groupId);

  return (
    <Container className={cx("groupAdmin")} narrow>
      <div className="noprint">
        <h1>{group.name}</h1>
        <h2>
          {group.subject} - {group.level} - {group.schoolYear}/{group.schoolYear + 1}
        </h2>
        <AddStudents />
        <StudentsTable groupStudents={group.groupStudents} />
      </div>
      <QRCodes groupStudents={group.groupStudents} />
    </Container>
  );
}
