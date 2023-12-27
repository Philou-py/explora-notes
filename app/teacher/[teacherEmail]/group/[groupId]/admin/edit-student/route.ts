import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { revalidateTag } from "next/cache";
import { checkIdentity } from "@/app/checkIdentity";
import { checkGroupTeacher } from "@/app/teacher/[teacherEmail]/group/[groupId]/checkGroupTeacher";

const UPDATE_STUDENT = `
  mutation($input: UpdateGroupStudentInput!) {
    updateGroupStudent(input: $input) {
      groupStudent {
        fullName
      }
    }
  }
`;

export async function PUT(request: Request, { params: { teacherEmail, groupId } }) {
  const identityCheck = await checkIdentity(
    "teacher",
    teacherEmail,
    "Oh non ! Vous n'êtes pas connecté(e), ou bien vous n'avez pas la permission de modifier cet élève !"
  );
  if (identityCheck !== true) return identityCheck;

  const groupTeacherCheck = await checkGroupTeacher(
    groupId,
    teacherEmail,
    "Désolé, mais vous n'avez pas la permission de modifier cet élève !"
  );
  if (groupTeacherCheck !== true) return groupTeacherCheck;

  const { firstName, lastName, id } = await request.json();

  if (firstName === "" || lastName === "")
    return NextResponse.json(
      { status: "error", msg: "Attention ! Vous ne pouvez pas laisser certains champs vides !" },
      { status: 400 }
    );

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: UPDATE_STUDENT,
        variables: {
          input: {
            filter: { id: id },
            set: { firstName, lastName, fullName: `${lastName} ${firstName}` },
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

    const studentName = result.data.updateGroupStudent.groupStudent[0].fullName;
    return NextResponse.json(
      { msg: `L'élève ${studentName} a bien été renommé !`, status: "success" },
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
