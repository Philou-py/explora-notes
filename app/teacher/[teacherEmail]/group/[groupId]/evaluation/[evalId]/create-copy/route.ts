import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

const ADD_COPY = `
  mutation($input: [AddCopyInput!]!) {
    addCopy(input: $input) {
      copy {
        id
        groupStudent {
          firstName
          lastName
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

export async function POST(request: Request, { params: { teacherEmail, groupId, evalId } }) {
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer une copie !",
      },
      { status: 403 }
    );

  const groupTeacher = await getGroupTeacher(groupId);
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission de créer une copie !",
      },
      { status: 403 }
    );

  const { studentId, categoryResults, summary } = await request.json();
  const copy = {
    groupStudent: {
      id: studentId,
    },
    ...summary,
    categoryResults,
    evaluation: { id: evalId },
    shouldObserve: false,
  };

  categoryResults.forEach((catRes: any) => {
    delete catRes.id;
    catRes.criterionResults.forEach((critRes: any) => {
      delete critRes.id;
    });
  });

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: ADD_COPY,
        variables: {
          input: copy,
        },
      }),
    });

    const { data, errors } = await dgraphRes.json();

    if (errors) {
      console.log(errors);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    const returnedCopy = data.addCopy.copy[0];

    revalidateTag("getEvaluation-" + evalId);
    revalidateTag("getCopy-" + returnedCopy.id);

    const grSt = returnedCopy.groupStudent;
    const stName = `${grSt.firstName} ${grSt.lastName}`;
    return NextResponse.json(
      {
        msg: `La copie de l'élève ${stName} a bien été créée !`,
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
