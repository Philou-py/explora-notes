import { NextResponse } from "next/server";
import { dgraphQuery } from "@/app/dgraphQuery";

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      teacher {
        email
      }
    }
  }
`;

export async function checkGroupTeacher(
  groupId: string,
  teacherEmail: string,
  customMsg?: string
): Promise<NextResponse | true> {
  const group = await dgraphQuery(GET_GROUP, { groupId }, "getGroup");
  const groupTeacher = group.teacher.email;

  if (groupTeacher !== teacherEmail) {
    console.log(`${teacherEmail} attempted interacting with ${groupTeacher}'s group!`);
    return NextResponse.json(
      {
        status: "error",
        msg: customMsg || "Désolé, mais vous n'avez pas la permission d'interagir avec ce groupe !",
      },
      { status: 403 }
    );
  }

  return true;
}
