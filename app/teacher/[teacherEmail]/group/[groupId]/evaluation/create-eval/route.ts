import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { TemplateForGr } from "@/contexts/SideBarContext";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

const ADD_EVAL = `
  mutation($input: [AddEvaluationInput!]!) {
    addEvaluation(input: $input) {
      evaluation {
        id
        group {
          name
        }
      }
    }
  }
`;

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

async function getGroupTeacher(groupId: string): Promise<Group> {
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
  return result.data.getGroup.teacher.email;
}

export async function POST(request: Request, { params: { teacherEmail, groupId } }) {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt)
    return NextResponse.json(
      { status: "error", msg: "Oh non ! Vous n'êtes pas connecté(e) !" },
      { status: 401 }
    );

  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "student")
    return NextResponse.json(
      {
        status: "error",
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer un barème !",
      },
      { status: 403 }
    );

  const groupTeacher = await getGroupTeacher(groupId);
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission d'ajouter des élèves à ce groupe !",
      },
      { status: 403 }
    );

  const newEval: TemplateForGr = await request.json();
  const newEvalToSend = {
    title: newEval.title,
    markPrecision: Number(newEval.markPrecision),
    coefficient: Number(newEval.coefficient),
    totalPoints: newEval.categories.reduce((p, cat) => p + cat.maxPoints, 0),
    categories: newEval.categories.map((cat, catRank) => {
      // Remove IDs and add ranks
      delete cat.id;
      cat.rank = catRank;
      return {
        ...cat,
        criteria: cat.criteria.map((crit, critRank) => {
          delete crit.id;
          crit.rank = critRank;
          return crit;
        }),
      };
    }),
    copies: [],
    average: -1,
    isClosed: false,
    criteriaToObserve: [],
    isPublished: false,
    teacher: {
      email: teacherEmail,
    },
    group: {
      id: groupId,
    },
  };

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: ADD_EVAL,
        variables: { input: newEvalToSend },
      }),
    });

    const result = await dgraphRes.json();

    if (result.errors) {
      console.log(result.errors);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    revalidateTag("getTeacher-" + teacherEmail);

    const receivedEval = result.data.addEvaluation.evaluation[0];
    return NextResponse.json(
      {
        msg: `Le barème a bien été créé et affecté au groupe ${receivedEval.group.name} !`,
        redirectURL: `/teacher/${teacherEmail}/group/${groupId}/evaluation/${receivedEval.id}`,
        status: "success",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}
