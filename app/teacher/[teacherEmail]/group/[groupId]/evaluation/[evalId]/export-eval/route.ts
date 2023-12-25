import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { roundNum } from "@/helpers/roundNum";
import { utils, write } from "xlsx";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/checkGroupTeacher";

interface Evaluation {
  title: string;
  totalPoints: number;
  group: {
    name: string;
  };
  copies: {
    totalPoints: number;
    mark: number;
    bonusPoints: number;
    penaltyPoints: number;
    categoryResults: {
      category: {
        rank: number;
        label: string;
        maxPoints: number;
      };
      points: number;
      criterionResults: {
        criterion: {
          rank: number;
          label: string;
          maxPoints: number;
        };
        points: number;
      }[];
    }[];
    groupStudent: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      title
      totalPoints
      copies {
        totalPoints
        mark
        bonusPoints
        penaltyPoints
        categoryResults {
          category {
            rank
            label
            maxPoints
          }
          points
          criterionResults {
            criterion {
              rank
              label
              maxPoints
            }
            points
          }
        }
        groupStudent {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export async function GET(_: Request, { params: { teacherEmail, groupId, evalId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission d'exporter cette évaluation !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission d'exporter cette évaluation !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const evalResponse = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GET_EVAL, variables: { evalId } }),
    cache: "no-store",
  });

  const evalResult = await evalResponse.json();

  if (evalResult.errors) {
    console.log(evalResult.errors);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  const evaluation: Evaluation = evalResult.data.getEvaluation;

  if (evaluation.copies.length === 0) {
    return NextResponse.json(
      {
        msg: "Attention, vous ne pouvez pas exporter les résultats de cette évaluation, car aucune copie n'a été corrigée !",
        status: "info",
      },
      { status: 400 }
    );
  }

  // Sort categoryResults and criterionResults
  evaluation.copies.forEach((copy) => {
    copy.categoryResults.sort((a, b) => a.category.rank - b.category.rank);
    copy.categoryResults.forEach((catRes) => {
      catRes.criterionResults.sort((a, b) => a.criterion.rank - b.criterion.rank);
    });
  });

  const headers: { [key: string]: string | number } = {
    "Nom de famille": "Barème",
    Prénom: "Barème",
    Note: evaluation.totalPoints,
    "Note sur 20": 20,
  };
  evaluation.copies[0].categoryResults.forEach((catRes) => {
    const catLabel = catRes.category.label;
    headers[catLabel] = catRes.category.maxPoints;
    catRes.criterionResults.forEach((critRes) => {
      headers[catLabel + " - " + critRes.criterion.label] = critRes.criterion.maxPoints;
    });
  });
  headers.Bonus = 0;
  headers.Malus = 0;

  const copies = evaluation.copies.map((copy) => {
    const obj: { [key: string]: string | number } = {
      "Nom de famille": copy.groupStudent.lastName,
      Prénom: copy.groupStudent.firstName,
      Note: copy.totalPoints,
      "Note sur 20": roundNum(copy.mark, 2),
    };
    copy.categoryResults.forEach((catRes) => {
      const catLabel = catRes.category.label;
      obj[catLabel] = catRes.points;
      catRes.criterionResults.forEach((critRes) => {
        obj[catLabel + " - " + critRes.criterion.label] = critRes.points;
      });
    });
    obj.Bonus = copy.bonusPoints;
    obj.Malus = copy.penaltyPoints;
    return obj;
  });

  copies.unshift(headers);

  const worksheet = utils.json_to_sheet(copies);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, evaluation.title);

  const buf = write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="SheetJSNode.xlsx"',
      "Content-Type": "application/vnd.ms-excel",
    },
  });
}
