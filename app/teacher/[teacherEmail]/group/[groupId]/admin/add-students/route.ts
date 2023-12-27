import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/checkGroupTeacher";

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

export async function PUT(request: Request, { params: { teacherEmail, groupId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission d'ajouter des élèves à ce groupe !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission d'ajouter des élèves à ce groupe !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

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
    newStudent.fullName = `${newStudent.lastName} ${newStudent.firstName}`;
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

    revalidateTag("getGroup-" + groupId);

    const groupName = result.data.updateGroup.group[0].name;
    return NextResponse.json(
      { msg: `Les élèves ont bien été ajoutés au groupe ${groupName} !`, status: "success" },
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
