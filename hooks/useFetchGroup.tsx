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
  pointsByEx: number[];
  bonusPoints: number;
  penaltyPoints: number;
  studentId: string;
  evaluationId: string;
  groupId: string;
}

const roundNum = (value: number, nbDecimals: number) => {
  if (value !== undefined) {
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
          rawContent:
            student.subjectAverageOutOf20 !== undefined ? student.subjectAverageOutOf20 : "",
          content:
            student.subjectAverageOutOf20 !== undefined
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
      { text: "Nom", value: "name" },
      { text: "Note de l’élève", value: "mark", alignContent: "center" },
      ...(evaluation
        ? evaluation.exerciseScale.map(
            (exPts, exId) =>
              ({
                text: `Ex ${exId + 1} (${exPts} pts)`,
                value: `ex${exId}`,
                alignContent: "center",
              } as TableHeader)
          )
        : []),
      { text: "Actions", value: "actions", alignContent: "center", isSortable: false },
    ],
    [evaluation]
  );

  const studentsTableItems = useMemo(
    () =>
      Object.values(studentMap).map((st) => ({
        key: { rawContent: st.id },
        name: { rawContent: st.lastName + " " + st.firstName },
        mark: {
          rawContent: copyMapPerStudent[st.id] ? copyMapPerStudent[st.id].mark : 0,
          content: copyMapPerStudent[st.id]
            ? `${roundNum(copyMapPerStudent[st.id].mark, 2)} / ${evaluation.totalPoints}` +
              (evaluation.totalPoints !== 20
                ? ` - ${roundNum(copyMapPerStudent[st.id].markOutOf20, 2)} / 20`
                : "")
            : "Copie non corrigée",
        },
        ...(copyMapPerStudent[st.id]
          ? copyMapPerStudent[st.id].pointsByEx.reduce(
              (prevVal, currVal, index) => ({
                ...prevVal,
                [`ex${index}`]: { rawContent: currVal },
              }),
              {}
            )
          : evaluation.exerciseScale.reduce(
              (prevVal, _, index) => ({
                ...prevVal,
                [`ex${index}`]: { rawContent: "-" },
              }),
              {}
            )),
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
              isDisabled={!copyMapPerStudent[st.id]}
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
    <DataTable headers={studentsTableHeaders} items={studentsTableItems} sortBy="name" />
  );

  const exTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Exercice", value: "exId" },
      { text: "Moyenne", value: "avMarkForEx", alignContent: "center" },
      { text: "Note min", value: "minMarkForEx", alignContent: "center" },
      { text: "Note max", value: "maxMarkForEx", alignContent: "center" },
    ],
    []
  );

  const exAvs = useMemo(
    () =>
      !notFound &&
      groupMap[groupId].evalStatistics[evalId] &&
      groupMap[groupId].evalStatistics[evalId].exerciseAverages
        ? groupMap[groupId].evalStatistics[evalId].exerciseAverages
        : [],
    [evalId, groupId, groupMap, notFound]
  );

  const exTableItems = useMemo(
    () =>
      exAvs.map((avOfEx, exIndex) => ({
        key: { rawContent: exIndex },
        exId: {
          rawContent: `Exercice ${exIndex + 1} (${
            evaluationMap[evalId].exerciseScale[exIndex]
          } pts)`,
        },
        avMarkForEx: {
          rawContent: avOfEx,
          content: roundNum(avOfEx, 2),
        },
        minMarkForEx: {
          rawContent: Math.min(
            ...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])
          ),
          content: Math.min(...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])),
        },
        maxMarkForEx: {
          rawContent: Math.max(
            ...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])
          ),
          content: Math.max(...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])),
        },
      })),
    [evalId, evaluationMap, copyMapPerStudent, exAvs]
  );

  const exTableTemplate = !notFound && (
    <DataTable headers={exTableHeaders} items={exTableItems} sortBy="exId" />
  );

  return { marksTableTemplate, exTableTemplate, notFound };
};
