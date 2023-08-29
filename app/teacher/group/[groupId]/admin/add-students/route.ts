import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";

const publicKey = readFileSync("public.key");

const ADD_STUDENTS = `
  mutation($input: UpdateGroupInput!) {
    updateGroup(input: $input) {
      group {
        name
        groupStudents {
          fullName
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

export async function PUT(request: Request, { params: { groupId } }) {
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
        msg: "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de créer un groupe !",
      },
      { status: 403 }
    );

  const teacherEmail = payload.email;
  const groupTeacher = await getGroupTeacher(groupId);
  if (groupTeacher !== teacherEmail)
    return NextResponse.json(
      {
        status: "error",
        msg: "Désolé, mais vous n'avez pas la permission d'ajouter des élèves à ce groupe !",
      },
      { status: 403 }
    );

  const newStudents = await request.json();

  // Test the new students for issues
  // Check for blanks
  let hasBlanks = false;
  newStudents.forEach((student: { firstName: string; lastName: string }) => {
    if (!student) return;
    if (student.firstName === "" || student.lastName === "") hasBlanks = true;
  });
  if (hasBlanks) {
    return NextResponse.json(
      { status: "error", msg: "Attention ! Vous ne pouvez pas laisser certains champs vides !" },
      { status: 400 }
    );
  }

  // Check for duplicates
  let hasDuplicates = false;
  const combined = {};
  for (let i = 0; i < newStudents.length; i++) {
    if (!newStudents[i]) continue;
    const combination = newStudents[i].firstName + newStudents[i].lastName;
    if (combined[combination]) {
      hasDuplicates = true;
      break;
    }
    combined[combination] = true;
  }
  if (hasDuplicates) {
    return NextResponse.json(
      { status: "error", msg: "Attention ! Au moins un élève a été entré plusieurs fois !" },
      { status: 400 }
    );
  }

  // Reshape the new students
  const newStudentsToSend = newStudents.filter((student: any) => !!student);
  newStudentsToSend.forEach((newStudent: any) => {
    newStudent.fullName = `${newStudent.firstName} ${newStudent.lastName}`;
    newStudent.copies = [];
    newStudent.studentPoints = 0;
    newStudent.studentCoefs = 0;
    newStudent.studentAverage = 0;
  });

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: ADD_STUDENTS,
        variables: {
          input: {
            filter: { id: groupId },
            set: { groupStudents: newStudentsToSend },
          },
        },
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

    revalidateTag("getGroupStudents");

    const groupName = result.data.updateGroup.group[0].name;
    return NextResponse.json(
      { msg: `Les élèves ont bien été ajouté au groupe ${groupName} !`, status: "success" },
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
