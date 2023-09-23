import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { sign } from "jsonwebtoken";

const publicKey = readFileSync("public.key");
const privateKey = readFileSync("private.key");

export interface GroupStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentAccount?: {
    username: string;
  };
}

interface Group {
  teacher: {
    email: string;
  };
  groupStudents: GroupStudent[];
}

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      groupStudents {
        id
        firstName
        lastName
        studentAccount {
          username
        }
      }
      teacher {
        email
      }
    }
  }
`;

async function getGroup(groupId: string): Promise<Group> {
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
  return result.data.getGroup;
}

async function getSignedIDs(groupStudentIDs: string[]) {
  return groupStudentIDs.map((id) => {
    return sign({ groupStudentId: id }, privateKey, {
      algorithm: "RS256",
      expiresIn: "1y",
    });
  });
}

export async function GET(_: Request, { params: { groupId } }) {
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de générer les QR Codes pour ce groupe !",
      },
      { status: 403 }
    );

  const teacherEmail = payload.email;
  const group = await getGroup(groupId);
  const groupTeacher = group.teacher.email;
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission de générer les QR Codes pour ce groupe !",
      },
      { status: 403 }
    );

  try {
    const signedIDs = await getSignedIDs(group.groupStudents.map((grSt) => grSt.id));
    return NextResponse.json({ signedIDs, status: "success" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}
