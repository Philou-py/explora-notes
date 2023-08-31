import { NextResponse } from "next/server";
import { DGRAPH_URL } from "@/config";
import { readFileSync } from "fs";
import { sign } from "jsonwebtoken";

const privateKey = readFileSync("private.key");

const ADD_STUDENT = `
  mutation($input: [AddStudentInput!]!) {
    addUser: addStudent(input: $input) {
      newUser: student {
        email
        displayName: username
      }
    }
  }
`;

const ADD_TEACHER = `
  mutation($input: [AddTeacherInput!]!) {
    addUser: addTeacher(input: $input) {
      newUser: teacher {
        email
        displayName: fullName
      }
    }
  }
`;

export async function POST(request: Request) {
  const { accountType, username, email, password, firstName, lastName } = await request.json();

  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: accountType === "student" ? ADD_STUDENT : ADD_TEACHER,
        variables: {
          input: {
            email,
            password,
            ...(accountType === "teacher"
              ? {
                  firstName,
                  lastName,
                  fullName: `${lastName} ${firstName}`,
                  groups: [],
                  evaluations: [],
                  evalTemplates: [blankTemplate, exerciseTemplate],
                }
              : {
                  username,
                  groupStudents: [],
                }),
          },
        },
      }),
    });

    const result = await dgraphRes.json();

    if (result.errors) {
      return NextResponse.json(
        {
          msg: "Désolé, mais cette adresse email est déjà utilisée !",
          status: "error",
        },
        { status: 400 }
      );
    }

    const newUser = result.data.addUser.newUser[0];

    const jwt = sign({ accountType, email: newUser.email }, privateKey, {
      algorithm: "RS256",
      expiresIn: "1y",
    });

    const response = NextResponse.json(
      { msg: `Bienvenue, ${newUser.displayName} !`, status: "success" },
      { status: 201 }
    );
    response.cookies.set({
      name: "X-ExploraNotes-Auth",
      value: jwt,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365, // valid for one year
      sameSite: "strict",
      secure: true,
    });

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { msg: "Oh non, une erreur non identifiée est survenue !", status: "error" },
      { status: 500 }
    );
  }
}

const blankTemplate = {
  title: "Catégories / Critères",
  coefficient: 1,
  markPrecision: 0.5,
  categories: [
    {
      rank: 0,
      label: "Catégorie",
      maxPoints: 1,
      criteria: [{ rank: 0, label: "Critère", maxPoints: 1, isBonus: false }],
    },
  ],
};

const exerciseTemplate = {
  title: "Exercices / Questions",
  coefficient: 1,
  markPrecision: 0.5,
  categories: [
    {
      rank: 0,
      label: "Exercice 1",
      maxPoints: 1,
      criteria: [{ rank: 0, label: "Question 1", maxPoints: 1, isBonus: false }],
    },
  ],
};
