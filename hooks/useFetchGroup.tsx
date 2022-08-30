import { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../contexts/AuthContext";
import { BreakpointsContext } from "../contexts/BreakpointsContext";
import { db } from "../firebase-config";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  CollectionReference,
  documentId,
  getDocs,
} from "firebase/firestore";
import { DataTable, Button } from "../components";

interface User {
  id: string;
  email: string;
  username: string;
}

interface TableHeader {
  text: string;
  value: string;
  isSortable?: boolean;
  align?: "start" | "center" | "end";
  alignContent?: "start" | "center" | "end";
  unitSuffix?: string;
}

interface Group {
  id: string;
  teacher: string;
  schoolYear: string;
  name: string;
  nbStudents: number;
  subject: string;
  studentMarkSummaries: {
    [id: string]: {
      subjectAverageOutOf20?: number;
      subjectWeightTotal: number;
      subjectPointsSum: number;
    };
  };
  evalStatistics: {
    [id: string]: {
      average: number;
      averageOutOf20: number;
      totalPoints: number;
      copyNb: number;
      minMark: number;
      minMarkOutOf20: number;
      maxMark: number;
      maxMarkOutOf20: number;
    };
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentMarkSummary: {
    subjectAverageOutOf20?: number;
    subjectWeightTotal: number;
    subjectPointsSum: number;
  };
}

interface Copy {
  mark: number;
  pointsObtained: number[];
  markOutOf20: number;
  totalPoints: number;
  coefficient: number;
  studentId: string;
  evaluationId: string;
  groupId: string;
}

interface StudentMark {
  mark?: number;
  markOutOf20?: number;
  totalPoints: number;
  pointsObtained: number[];
  copyId: string;
}

const roundNum = (value: number, nbDecimals: number) => {
  if (value) {
    return Math.round((value + Number.EPSILON) * 10 ** nbDecimals) / 10 ** nbDecimals;
  } else {
    return "";
  }
};

export const useStudentsTable = () => {
  const router = useRouter();
  const { groupId } = router.query as { groupId: string };
  const { currentUser } = useContext(AuthContext);
  const { students, group, groupNotFound } = useFetchGroup(groupId, currentUser);

  const studentsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Nom de famille", value: "lastName" },
      { text: "Prénom", value: "firstName" },
      {
        text: "Moyenne dans cette matière",
        value: "subjectAverageOutOf20",
        alignContent: "center",
      },
    ],
    []
  );

  const studentsTableItems = useMemo(
    () =>
      students.map((student) => ({
        key: { rawContent: student.id },
        lastName: { rawContent: student.lastName },
        firstName: { rawContent: student.firstName },
        subjectAverageOutOf20: {
          rawContent:
            student.studentMarkSummary && student.studentMarkSummary.subjectAverageOutOf20
              ? student.studentMarkSummary.subjectAverageOutOf20
              : "",
          content:
            student.studentMarkSummary && student.studentMarkSummary.subjectAverageOutOf20
              ? `${roundNum(student.studentMarkSummary.subjectAverageOutOf20, 2)} / 20`
              : "Pas encore de notes !",
        },
      })),
    [students]
  );

  const studentsTableTemplate = !groupNotFound && (
    <DataTable headers={studentsTableHeaders} items={studentsTableItems} sortBy="lastName" />
  );

  return { groupNotFound, studentsTableTemplate, group };
};

export const useMarksTable = (
  handleAddCopy: (student: Student, minMWS: number, maxMWS: number) => void,
  handleDeleteCopy: (
    student: Student,
    studentMark: StudentMark,
    group: Group,
    minMWS: number,
    maxMWS: number
  ) => void,
  prefillCopyForm: (studentMark: StudentMark, copyId: string) => void
) => {
  const router = useRouter();
  const { groupId, evalId } = router.query as { groupId: string; evalId: string };
  const { currentUser } = useContext(AuthContext);
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const [marksByStudent, setMarksByStudent] = useState<{
    [key: string]: StudentMark;
  }>({});
  const [copyMarks, setCopyMarks] = useState<[string, number][]>([]);
  const { group, students, groupNotFound } = useFetchGroup(groupId, currentUser);

  const getCopies = useCallback(() => {
    const qCopies = query(
      collection(db, "copies") as CollectionReference<Copy>,
      where("groupId", "==", groupId || ""),
      where("evaluationId", "==", evalId || "")
    );

    const copiesUnsub = onSnapshot(qCopies, (copiesSnapshot) => {
      const mByStudent = {};
      const copyMarks = [];

      copiesSnapshot.forEach((copyRef) => {
        const copyData = copyRef.data();
        mByStudent[copyData.studentId] = {
          mark: copyData.mark,
          markOutOf20: copyData.markOutOf20,
          totalPoints: copyData.totalPoints,
          pointsObtained: copyData.pointsObtained,
          copyId: copyRef.id,
        };
        copyMarks.push([copyData.studentId, copyData.mark]);
      });

      setMarksByStudent(mByStudent);
      setCopyMarks(copyMarks);
    });

    return copiesUnsub;
  }, [evalId, groupId]);

  useEffect(() => getCopies(), [getCopies]);

  const studentsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Nom de famille", value: "lastName" },
      { text: "Prénom", value: "firstName" },
      { text: "Note de l’élève", value: "mark", alignContent: "center" },
      { text: "Actions", value: "actions", alignContent: "center", isSortable: false },
    ],
    []
  );

  const studentsTableItems = useMemo(
    () =>
      students.map((student) => ({
        key: { rawContent: student.id },
        lastName: { rawContent: student.lastName },
        firstName: { rawContent: student.firstName },
        mark: {
          rawContent: marksByStudent[student.id] ? marksByStudent[student.id].mark : "",
          content: marksByStudent[student.id]
            ? `${marksByStudent[student.id].mark} / ${
                marksByStudent[student.id].totalPoints
              } - ${roundNum(marksByStudent[student.id].markOutOf20, 2)} / 20`
            : "Copie non corrigée",
        },
        actions: {
          rawContent: "",
          content: [
            <Button
              type={cbp === "sm" ? "icon" : "text"}
              size="small"
              iconName={
                cbp === "sm" ? (marksByStudent[student.id] ? "edit_note" : "post_add") : undefined
              }
              prependIcon={
                cbp === "sm" ? undefined : marksByStudent[student.id] ? "edit_note" : "post_add"
              }
              className="purple--text"
              key={`manage-copy-${student.id}`}
              onClick={() => {
                if (marksByStudent[student.id] && prefillCopyForm) {
                  prefillCopyForm(marksByStudent[student.id], marksByStudent[student.id].copyId);
                }
                handleAddCopy(
                  student,
                  Math.min(...copyMarks.filter((c) => c[0] !== student.id).map((c) => c[1])),
                  Math.max(...copyMarks.filter((c) => c[0] !== student.id).map((c) => c[1]))
                );
              }}
              isFlat
            >
              {cbp === "sm"
                ? undefined
                : marksByStudent[student.id]
                ? "Modifier la copie"
                : "Ajouter une copie"}
            </Button>,
            <Button
              type="icon"
              size="small"
              iconName="delete"
              className="red--text ml-1"
              key={`delete-copy-${student.id}`}
              onClick={() => {
                handleDeleteCopy(
                  student,
                  marksByStudent[student.id],
                  group,
                  Math.min(...copyMarks.filter((c) => c[0] !== student.id).map((c) => c[1])),
                  Math.max(...copyMarks.filter((c) => c[0] !== student.id).map((c) => c[1]))
                );
              }}
              isFlat
            />,
          ],
        },
      })),
    [
      students,
      cbp,
      handleAddCopy,
      handleDeleteCopy,
      prefillCopyForm,
      marksByStudent,
      copyMarks,
      group,
    ]
  );

  const marksTableTemplate = !groupNotFound && (
    <DataTable headers={studentsTableHeaders} items={studentsTableItems} sortBy="lastName" />
  );

  return {
    marksTableTemplate,
    group,
    evalStatistics: group && group.evalStatistics[evalId],
    groupNotFound,
  };
};

export const useFetchGroup = (groupId: string, currentUser?: User) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [group, setGroup] = useState<Group | undefined>();
  const [groupNotFound, setNotFound] = useState(false);

  const getGroup = useCallback(() => {
    if (currentUser) {
      const groupUnsub = onSnapshot(doc(db, "groups", groupId), async (groupSnapshot) => {
        if (groupSnapshot.exists()) {
          const groupData = groupSnapshot.data();
          if (groupData.teacher === currentUser.id) {
            const studentsSnapshot = await getDocs(
              query(
                collection(db, "students") as CollectionReference<Student>,
                where(documentId(), "in", groupData.studentIds)
              )
            );

            const fetchedStudents = [];
            studentsSnapshot.forEach((studentRef) =>
              fetchedStudents.push({
                id: studentRef.id,
                studentMarkSummary: groupData.studentMarkSummaries[studentRef.id],
                ...studentRef.data(),
              })
            );

            setStudents(fetchedStudents);
            setGroup({ id: groupSnapshot.id, ...groupData } as Group);
            setNotFound(false);
            return;
          }
        }
        setNotFound(true);
        setGroup(undefined);
      });
      return groupUnsub;
    } else {
      setNotFound(true);
      setGroup(undefined);
      return () => {};
    }
  }, [groupId, currentUser]);

  useEffect(() => getGroup(), [getGroup]);

  return { groupNotFound, group, students };
};
