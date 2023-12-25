import { checkIdentity } from "@/app/checkIdentity";
import { dgraphQuery } from "@/app/dgraphQuery";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/checkGroupTeacher";
import { NextResponse } from "next/server";

const GET_COPY = `
  query($copyId: ID!) {
    getCopy(id: $copyId) {
      id
      totalPoints
      comments
      bonusPoints
      penaltyPoints
      shouldObserve
      categoryResults {
        id
        points
        comment
        category {
          id
        }
        criterionResults {
          id
          points
          criterion {
            id
          }
        }
      }
    }
  }
`;

export async function GET(_: Request, { params: { teacherEmail, groupId, copyId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de voir les détails de cette copie !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de voir les détails de cette copie !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  return NextResponse.json({
    copy: await dgraphQuery(GET_COPY, { copyId }, "getCopy", `getCopy-${copyId}`),
  });
}
