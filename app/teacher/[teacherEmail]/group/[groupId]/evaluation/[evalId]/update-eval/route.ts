import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { TemplateForGr } from "@/contexts/SideBarContext";
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

const GET_COPIES = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      copies {
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

  type RequestBody = TemplateForGr & { criteriaToObserve: string[] };
  const updatedEval: RequestBody = await request.json();
  const eToSend = {
    title: updatedEval.title,
    coefficient: Number(updatedEval.coefficient),
    totalPoints: updatedEval.categories.reduce((p, cat) => p + cat.maxPoints, 0),
    criteriaToObserve: updatedEval.criteriaToObserve,
  };

  let OPS = "";

  const crToObStr = eToSend.criteriaToObserve.map((crit) => `{ id: "${crit}" },`).join(" ");
  OPS += `
    updateEvaluation(input: { filter: { id: "${evalId}" }, set: { title: "${eToSend.title}", coefficient: ${eToSend.coefficient}, totalPoints: ${eToSend.totalPoints}, criteriaToObserve: [${crToObStr}] } }) {
      evaluation {
        title
      }
    }
  `;

  const updatedCategories = updatedEval.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    maxPoints: cat.maxPoints,
  }));
  const updatedCriteria = updatedEval.categories.reduce(
    (arr, cat) =>
      arr.concat(
        cat.criteria.map((crit) => ({ id: crit.id, label: crit.label, maxPoints: crit.maxPoints }))
      ),
    []
  );

  updatedCategories.map((cat) => {
    OPS += `
      updateCategory${cat.id}: updateCategory(input: { filter: { id: "${cat.id}" }, set: { label: "${cat.label}", maxPoints: ${cat.maxPoints} } }) {
        category {
          id
        }
      }
    `;
  });
  updatedCriteria.map((crit) => {
    OPS += `
      updateCriterion${crit.id}: updateCriterion(input: { filter: { id: "${crit.id}" }, set: { label: "${crit.label}", maxPoints: ${crit.maxPoints} } }) {
        criterion {
          id
        }
      }
    `;
  });

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: `mutation { ${OPS} }` }),
    });

    const result = await dgraphRes.json();

    if (result.errors) {
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    const copyResp = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: GET_COPIES, variables: { evalId } }),
    });
    const copyResult = await copyResp.json();
    const copyIDs: string[] = copyResult.data.getEvaluation.copies.map((copy: any) => copy.id);

    let OPS2 = ``;
    copyIDs.map((id) => {
      OPS2 += `
        updateCopy(input: { filter: { id: "${id}" }, set: { shouldObserve: true } }) {
          copy {
            id
          }
        }
      `;
    });

    const updateCopiesResponse = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: `mutation { ${OPS2} }` }),
    });

    const updateCopiesResult = await updateCopiesResponse.json();

    if (updateCopiesResult.errors) {
      console.log(updateCopiesResult.errors);
      return NextResponse.json(
        { msg: "Oh non, une erreur est survenue !", status: "error" },
        { status: 400 }
      );
    }

    revalidateTag("getTeacher-" + teacherEmail);
    revalidateTag("getEvaluation-" + evalId);

    return NextResponse.json(
      {
        msg: `L'évaluation ${result.data.updateEvaluation.evaluation[0].title} a bien été modifié !`,
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
