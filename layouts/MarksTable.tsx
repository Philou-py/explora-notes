import { useState, useContext, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/router";
import { BreakpointsContext } from "../contexts/BreakpointsContext";
import { SnackContext } from "../contexts/SnackContext";
import { TeacherContext, Student, Copy } from "../contexts/TeacherContext";
import { useConfirmation } from "../hooks/useConfirmation";
import { DataTable, TableHeader, Button } from "../components";
import { roundNum } from "../helpers/roundNum";
import { db } from "../firebase-config";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import ManageCopyModal from "./ManageCopyModal";

interface FormProps {
  isEditing: boolean;
  currentCopy: Copy;
  currentStudent: Student;
  currentMinMark: number;
  currentMaxMark: number;
}

function MarksTable() {
  const router = useRouter();
  const { groupId, evalId } = router.query as { groupId: string; evalId: string };
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { haveASnack } = useContext(SnackContext);
  const { evaluationMap, groupMap } = useContext(TeacherContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();
  const [modalOpen, setModalOpen] = useState(false);
  const [formProps, setFormProps] = useState<FormProps>();

  const notFound = useMemo(() => {
    return !(
      groupId &&
      groupMap[groupId] &&
      evalId &&
      evaluationMap[evalId] &&
      evaluationMap[evalId].associatedGroupIds.includes(groupId)
    );
  }, [evaluationMap, groupId, evalId, groupMap]);

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

  const deleteCopy = useCallback(
    (student: Student, studentCopy: Copy, min: number, max: number) => {
      promptConfirmation(
        `Confirmez-vous vouloir supprimer la copie de ${student.firstName} ${student.lastName} ?`,
        async () => {
          await updateDoc(doc(db, "evaluations", studentCopy.evaluationId), {
            [`copies.${groupId}.${student.id}`]: deleteField(),
          });
          // await deleteDoc(doc(db, "copies", studentCopy.id));

          const oldSubjectPointsSum = student.subjectPointsSum;
          const oldSubjectWeightTotal = student.subjectWeightTotal;

          const newSubjectPointsSum =
            oldSubjectPointsSum - studentCopy.markOutOf20 * evaluation.coefficient;
          const newSubjectWeightTotal = oldSubjectWeightTotal - evaluation.coefficient;
          const newSubjectAverageOutOf20 = newSubjectPointsSum / newSubjectWeightTotal;

          const noMoreCopies = newSubjectWeightTotal === 0;

          const newStudentMarkSummary = {
            ...(noMoreCopies
              ? { [`studentMap.${student.id}.subjectAverageOutOf20`]: deleteField() }
              : { [`studentMap.${student.id}.subjectAverageOutOf20`]: newSubjectAverageOutOf20 }),
            [`studentMap.${student.id}.subjectPointsSum`]: newSubjectPointsSum,
            [`studentMap.${student.id}.subjectWeightTotal`]: newSubjectWeightTotal,
          };

          const oldEvalStatistics = groupMap[groupId].evalStatistics[evalId];
          const oldCopyNb = oldEvalStatistics.copyNb;
          const oldTotalPoints = oldEvalStatistics.totalPoints;
          const oldExTotPts = oldEvalStatistics.exerciseTotalPoints;

          const newCopyNb = oldCopyNb - 1;
          const newTotalPoints = oldTotalPoints - studentCopy.mark;
          const newAverage = newTotalPoints / newCopyNb;
          const newAverageOutOf20 = (newAverage * 20) / evaluation.totalPoints;
          const newMinMark = min;
          const newMinMarkOutOf20 = (newMinMark * 20) / evaluation.totalPoints;
          const newMaxMark = max;
          const newMaxMarkOutOf20 = (newMaxMark * 20) / evaluation.totalPoints;
          const newExTotPts = oldExTotPts.map(
            (oldExPoints, exIndex) => oldExPoints - studentCopy.pointsByEx[exIndex]
          );
          const newExAvs = newExTotPts.map((exTotPts) => exTotPts / newCopyNb);

          const newEvalStatistics = {
            ...(newCopyNb !== 0
              ? {
                  average: newAverage,
                  averageOutOf20: newAverageOutOf20,
                  copyNb: newCopyNb,
                  maxMark: newMaxMark,
                  maxMarkOutOf20: newMaxMarkOutOf20,
                  minMark: newMinMark,
                  minMarkOutOf20: newMinMarkOutOf20,
                  totalPoints: newTotalPoints,
                  exerciseAverages: newExAvs,
                  exerciseTotalPoints: newExTotPts,
                }
              : {}),
          };

          await updateDoc(doc(db, "groups", groupId), {
            ...newStudentMarkSummary,
            [`evalStatistics.${evalId}`]: newEvalStatistics,
          });

          haveASnack(
            "success",
            <h6>
              La copie de {student.firstName} {student.lastName} a bien été supprimée !
            </h6>
          );
        }
      );
    },
    [evaluation, groupMap, groupId, evalId, haveASnack, promptConfirmation]
  );

  const marksTableHeaders = useMemo<TableHeader[]>(
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

  const marksTableItems = useMemo(
    () =>
      Object.values(studentMap).map((st) => ({
        key: { rawContent: st.id },
        name: { rawContent: st.lastName + " " + st.firstName },
        mark: {
          rawContent:
            copyMapPerStudent[st.id] && !copyMapPerStudent[st.id].modifiedQuestions
              ? copyMapPerStudent[st.id].mark
              : 0,
          content: copyMapPerStudent[st.id]
            ? !copyMapPerStudent[st.id].modifiedQuestions
              ? roundNum(copyMapPerStudent[st.id].mark, 2) +
                " / " +
                evaluation.totalPoints +
                (evaluation.totalPoints !== 20
                  ? ` - ${roundNum(copyMapPerStudent[st.id].markOutOf20, 2)} / 20`
                  : "")
              : "Ajustement des points..."
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
                const newProps: Partial<FormProps> = { isEditing: false };
                if (copyMapPerStudent[st.id]) {
                  newProps.currentCopy = copyMapPerStudent[st.id];
                  newProps.isEditing = true;
                }
                newProps.currentStudent = st;
                newProps.currentMinMark = Math.min(
                  ...Object.values(copyMapPerStudent)
                    .filter((c) => c.studentId !== st.id)
                    .map((c) => c.mark)
                );
                newProps.currentMaxMark = Math.max(
                  ...Object.values(copyMapPerStudent)
                    .filter((c) => c.studentId !== st.id)
                    .map((c) => c.mark)
                );
                setFormProps(newProps as FormProps);
                setModalOpen(true);
              }}
              isFlat
            >
              {cbp === "sm"
                ? undefined
                : copyMapPerStudent[st.id]
                ? copyMapPerStudent[st.id].modifiedQuestions
                  ? "Ajuster les points"
                  : "Modifier la copie"
                : "Ajouter une copie"}
            </Button>,
            <Button
              type="icon"
              size="small"
              iconName="delete"
              className="red--text ml-1"
              key={`delete-copy-${st.id}`}
              onClick={() => {
                deleteCopy(
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
    [cbp, deleteCopy, copyMapPerStudent, studentMap, evaluation]
  );

  return (
    <>
      <DataTable headers={marksTableHeaders} items={marksTableItems} sortBy="name" />
      <ManageCopyModal modalOpen={modalOpen} setModalOpen={setModalOpen} {...formProps} />
      {confirmModalTemplate}
    </>
  );
}

export default memo(MarksTable);
