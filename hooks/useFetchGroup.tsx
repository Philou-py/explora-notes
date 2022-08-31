import { useContext, useMemo } from "react";
import { useRouter } from "next/router";
import { BreakpointsContext } from "../contexts/BreakpointsContext";
import { TeacherContext } from "../contexts/TeacherContext";
import { DataTable, Button } from "../components";

interface TableHeader {
  text: string;
  value: string;
  isSortable?: boolean;
  align?: "start" | "center" | "end";
  alignContent?: "start" | "center" | "end";
  unitSuffix?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  subjectAverageOutOf20?: number;
  subjectWeightTotal: number;
  subjectPointsSum: number;
}

interface Copy {
  id: string;
  mark: number;
  pointsObtained: number[];
  markOutOf20: number;
  coefficient: number;
  studentId: string;
  evaluationId: string;
  groupId: string;
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
  const { groupMap } = useContext(TeacherContext);
  const group = useMemo(() => groupMap[groupId], [groupMap, groupId]);
  const groupNotFound = useMemo(() => group === undefined, [group]);
  const students = useMemo(
    () => !groupNotFound && Object.values(group.studentMap),
    [group, groupNotFound]
  );

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
      students &&
      students.map((student) => ({
        key: { rawContent: student.id },
        lastName: { rawContent: student.lastName },
        firstName: { rawContent: student.firstName },
        subjectAverageOutOf20: {
          rawContent: student.subjectAverageOutOf20 ? student.subjectAverageOutOf20 : "",
          content: student.subjectAverageOutOf20
            ? roundNum(student.subjectAverageOutOf20, 2)
            : "Pas encore de notes !",
        },
      })),
    [students]
  );

  const studentsTableTemplate = !groupNotFound && (
    <DataTable headers={studentsTableHeaders} items={studentsTableItems} sortBy="lastName" />
  );

  return { groupNotFound, studentsTableTemplate, group, students };
};

export const useMarksTable = (
  handleAddCopy: (student: Student, minMWS: number, maxMWS: number) => void,
  handleDeleteCopy: (student: Student, studentCopy: Copy, minMWS: number, maxMWS: number) => void,
  prefillCopyForm: (copy: Copy) => void
) => {
  const router = useRouter();
  const { groupId, evalId } = router.query as { groupId: string; evalId: string };
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { evaluationMap, groupMap } = useContext(TeacherContext);

  const notFound = useMemo(() => {
    return !(
      evalId &&
      groupId &&
      evaluationMap[evalId] &&
      evaluationMap[evalId].associatedGroupIds.includes(groupId)
    );
  }, [evaluationMap, groupId, evalId]);

  const copyMapPerStudent = useMemo<{ [sId: string]: Copy }>(
    () =>
      !notFound && evaluationMap[evalId].copies[groupId]
        ? evaluationMap[evalId].copies[groupId]
        : {},
    [notFound, evaluationMap, groupId, evalId]
  );

  const studentMap = useMemo(
    () => (!notFound ? groupMap[groupId].studentMap : {}),
    [notFound, groupMap, groupId]
  );

  const evaluation = useMemo(
    () => !notFound && evaluationMap[evalId],
    [notFound, evaluationMap, evalId]
  );

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
      Object.values(studentMap).map((st) => ({
        key: { rawContent: st.id },
        lastName: { rawContent: st.lastName },
        firstName: { rawContent: st.firstName },
        mark: {
          rawContent: copyMapPerStudent[st.id] && copyMapPerStudent[st.id].mark,
          content: copyMapPerStudent[st.id]
            ? `${roundNum(copyMapPerStudent[st.id].mark, 2)} / ${
                evaluation.totalPoints
              } - ${roundNum(copyMapPerStudent[st.id].markOutOf20, 2)} / 20`
            : "Copie non corrigée",
        },
        actions: {
          rawContent: "",
          content: [
            <Button
              type={cbp === "sm" ? "icon" : "text"}
              size="small"
              iconName={
                cbp === "sm" ? (copyMapPerStudent[st.id] ? "edit_note" : "post_add") : undefined
              }
              prependIcon={
                cbp === "sm" ? undefined : copyMapPerStudent[st.id] ? "edit_note" : "post_add"
              }
              className="purple--text"
              key={`manage-copy-${st.id}`}
              onClick={() => {
                if (copyMapPerStudent[st.id] && prefillCopyForm) {
                  prefillCopyForm(copyMapPerStudent[st.id]);
                }
                handleAddCopy(
                  st,
                  Math.min(
                    ...Object.values(copyMapPerStudent)
                      .filter((c) => c.studentId !== st.id)
                      .map((c) => c.mark)
                  ),
                  Math.max(
                    ...Object.values(copyMapPerStudent)
                      .filter((c) => c.studentId !== st.id)
                      .map((c) => c.mark)
                  )
                );
              }}
              isFlat
            >
              {cbp === "sm"
                ? undefined
                : copyMapPerStudent[st.id]
                ? "Modifier la copie"
                : "Ajouter une copie"}
            </Button>,
            <Button
              type="icon"
              size="small"
              iconName="delete"
              className="red--text ml-1"
              key={`delete-copy-${st.id}`}
              onClick={() => {
                handleDeleteCopy(
                  st,
                  copyMapPerStudent[st.id],
                  Math.min(
                    ...Object.values(copyMapPerStudent)
                      .filter((c) => c.studentId !== st.id)
                      .map((c) => c.mark)
                  ),
                  Math.max(
                    ...Object.values(copyMapPerStudent)
                      .filter((c) => c.studentId !== st.id)
                      .map((c) => c.mark)
                  )
                );
              }}
              isFlat
            />,
          ],
        },
      })),
    [
      cbp,
      handleAddCopy,
      handleDeleteCopy,
      prefillCopyForm,
      copyMapPerStudent,
      studentMap,
      evaluation,
    ]
  );

  const marksTableTemplate = !notFound && (
    <DataTable headers={studentsTableHeaders} items={studentsTableItems} sortBy="lastName" />
  );

  return { marksTableTemplate, notFound };
};
