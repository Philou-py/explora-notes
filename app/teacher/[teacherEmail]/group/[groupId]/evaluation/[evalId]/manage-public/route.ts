import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

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

const UPDATE_EVAL = `
  mutation($input: UpdateEvaluationInput!) {
    updateEvaluation(input: $input) {
      evaluation {
        id
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier cette évaluation !",
      },
      { status: 403 }
    );

  const groupTeacher = await getGroupTeacher(groupId);
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission de modifier cette évaluation !",
      },
      { status: 403 }
    );

  const { isPublished } = await request.json();

  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: UPDATE_EVAL,
      variables: {
        input: {
          filter: { id: evalId },
          set: { isPublished },
        },
      },
    }),
  });
  const result = await dgraphRes.json();

  revalidateTag("getEvalPublished-" + evalId);

  if (result.errors) {
    console.log(result.errors);
    return NextResponse.json(
      { msg: "Oh non, une erreur est survenue !", status: "error" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      msg: `L'évaluation a bien été rendue ${isPublished ? "publique" : "privée"} !`,
      status: "success",
    },
    { status: 200 }
  );
}
