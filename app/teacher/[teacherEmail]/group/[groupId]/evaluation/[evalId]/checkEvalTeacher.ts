import { NextResponse } from "next/server";
import { dgraphQuery } from "@/app/dgraphQuery";

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      teacher {
        email
      }
    }
  }
`;

export async function checkEvalTeacher(
  evalId: string,
  teacherEmail: string,
  customMsg?: string
): Promise<NextResponse | true> {
  const evaluation = await dgraphQuery(GET_EVAL, { evalId }, "getEvaluation");
  const evalTeacher = evaluation.teacher.email;

  if (evalTeacher !== teacherEmail) {
    console.log(`${teacherEmail} attempted interacting with ${evalTeacher}'s evaluation!`);
    return NextResponse.json(
      {
        status: "error",
        msg:
          customMsg ||
          "Désolé, mais vous n'avez pas la permission d'interagir avec cette évaluation !",
      },
      { status: 403 }
    );
  }

  return true;
}
