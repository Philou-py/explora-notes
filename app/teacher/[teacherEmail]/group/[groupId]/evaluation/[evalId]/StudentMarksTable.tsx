import DataTable, { TableHeader } from "@/components/DataTable";
import CopyActionTriggers from "./CopyActionTriggers";
import CopyDialog from "./CopyDialog";
import { dgraphQuery } from "@/app/dgraphQuery";
import { roundNum } from "@/helpers/roundNum";
import { Suspense } from "react";

interface GroupStudent {
  id: string;
  firstName: string;
  lastName: string;
  copy?: {
    id: string;
    totalPoints: number;
    mark: number;
    categoryResults: {
      category: {
        id: string;
      };
      points: number;
    }[];
  };
}

interface Eval {
  students: GroupStudent[];
  categories: RawEval["categories"];
  totalPoints: number;
  markPrecision: number;
}

export interface GroupStudentName {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Scale {
  totalPoints: number;
  markPrecision: number;
  categories: {
    id: string;
    label: string;
    maxPoints: number;
    criteria: {
      id: string;
      label: string;
      maxPoints: number;
    }[];
  }[];
}

interface RawEval extends Scale {
  totalPoints: number;
  markPrecision: number;
  group: {
    id: string;
  };
  copies: {
    id: string;
    totalPoints: number;
    mark: number;
    categoryResults: {
      category: { id: string };
      points: number;
    }[];
    groupStudent: { id: string };
  }[];
}

const GET_STUDENTS = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      groupStudents {
        id
        firstName
        lastName
      }
    }
  }
`;

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      totalPoints
      markPrecision
      group {
        id
      }
      categories (order: { asc: rank } ) {
        id
        label
        maxPoints
        criteria (order: { asc: rank } ) {
          id
          label
          maxPoints
        }
      }
      copies {
        id
        totalPoints
        mark
        categoryResults {
          category {
            id
          }
          points
        }
        groupStudent {
          id
        }
      }
    }
  }
`;

async function getEvalResults(evalId: string): Promise<Eval> {
  const evaluation: RawEval = await dgraphQuery(
    GET_EVAL,
    { evalId },
    "getEvaluation",
    `getEvaluation-${evalId}`
  );

  const { groupStudents }: { groupStudents: GroupStudentName[] } = await dgraphQuery(
    GET_STUDENTS,
    { groupId: evaluation.group.id },
    "getGroup",
    "getGroup-" + evaluation.group.id
  );
  const students = groupStudents.map((grSt) => ({
    ...grSt,
    copy: evaluation.copies.find((c) => c.groupStudent.id === grSt.id),
  }));
  return {
    students,
    categories: evaluation.categories,
    totalPoints: evaluation.totalPoints,
    markPrecision: evaluation.markPrecision,
  };
}

export default async function StudentMarksTable({ evalId }: { evalId: string }) {
  const { totalPoints, markPrecision, categories, students } = await getEvalResults(evalId);

  const genMarkDisplay = (pts: number, mark: number) => {
    return totalPoints === 20
      ? `${pts} / 20`
      : `${pts} / ${totalPoints} - ${roundNum(mark, 2)} / 20`;
  };

  const studentsTableHeaders: TableHeader[] = [
    { text: "Nom de famille", value: "lastName" },
    { text: "Prénom", value: "firstName" },
    ...categories.map((cat) => ({ text: cat.label, value: cat.id })),
    { text: "Actions", value: "actions", alignContent: "center", isSortable: false },
  ];

  const studentsTableItems = students.map((st) => ({
    key: { rawContent: st.id },
    firstName: { rawContent: st.firstName.toLowerCase(), content: st.firstName },
    lastName: { rawContent: st.lastName.toLowerCase(), content: st.lastName },
    mark: {
      rawContent: st.copy ? st.copy.mark : 0,
      content: st.copy ? genMarkDisplay(st.copy.totalPoints, st.copy.mark) : "Copie non corrigée",
    },
    ...(st.copy
      ? st.copy.categoryResults.reduce(
          (cols, catRes) => ({ ...cols, [catRes.category.id]: { rawContent: catRes.points } }),
          {}
        )
      : categories.reduce((cols, cat) => ({ ...cols, [cat.id]: { rawContent: "-" } }), {})),
    actions: {
      rawContent: "",
      content: (
        <CopyActionTriggers
          copyId={st.copy && st.copy.id}
          studentId={st.id}
          studentName={`${st.firstName} ${st.lastName}`}
        />
      ),
    },
  }));

  return (
    <>
      <CopyDialog scale={{ totalPoints, markPrecision, categories }} />
      <DataTable
        headers={studentsTableHeaders}
        items={studentsTableItems}
        sortBy="lastName"
        lineNumbering
      />
    </>
  );
}
