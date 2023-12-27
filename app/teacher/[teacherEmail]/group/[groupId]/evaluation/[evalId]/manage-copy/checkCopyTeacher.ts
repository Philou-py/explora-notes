import { NextResponse } from "next/server";
import { dgraphQuery } from "@/app/dgraphQuery";

const GET_COPY = `
  query($copyId: ID!) {
    getCopy(id: $copyId) {
      evaluation {
        group {
          teacher {
            email
          }
        }
      }
    }
  }
`;

export async function checkCopyTeacher(
  copyId: string,
  teacherEmail: string,
  customMsg?: string
): Promise<NextResponse | true> {
  const copy = await dgraphQuery(GET_COPY, { copyId }, "getCopy");
  const copyTeacher = copy.evaluation.group.teacher.email;

  if (copyTeacher !== teacherEmail) {
    console.log(`${teacherEmail} attempted interacting with ${copyTeacher}'s copy!`);
    return NextResponse.json(
      {
        status: "error",
        msg:
          customMsg || "Désolé, mais vous n'avez pas la permission d'interagir avec cette copie !",
      },
      { status: 403 }
    );
  }

  return true;
}
