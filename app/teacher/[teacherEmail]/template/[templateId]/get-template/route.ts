import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";

const publicKey = readFileSync("public.key");

export interface EvalTemplate {
  id: string;
  title: string;
  markPrecision: number;
  categories: {
    id: number;
    rank: number;
    label: string;
    maxPoints: number;
    criteria: {
      id: number;
      rank: number;
      label: string;
      maxPoints: number;
      isBonus: boolean;
    }[];
  }[];
  coefficient: number;
  teacher: {
    email: string;
  };
}

const GET_TEMPLATE = `
  query($templateId: ID!) {
    getEvalTemplate(id: $templateId) {
      id
      title
      coefficient
      markPrecision
      categories {
        rank
        label
        maxPoints
        criteria {
          rank
          label
          maxPoints
          isBonus
        }
      }
      teacher {
        email
      }
    }
  }
`;

async function getTemplate(templateId: string): Promise<EvalTemplate> {
  const dgraphRes = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_TEMPLATE,
      variables: { templateId },
    }),
  });
  const result = await dgraphRes.json();
  return result.data.getEvalTemplate;
}

export async function GET(_, { params: { templateId } }) {
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de voir ce modèle !",
      },
      { status: 403 }
    );

  const teacherEmail = payload.email;
  const template = await getTemplate(templateId);
  if (template.teacher.email !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission de voir ce modèle !",
      },
      { status: 403 }
    );

  return NextResponse.json({ template, status: "success" }, { status: 200 });
}
