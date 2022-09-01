import { useState, useCallback, useContext, useMemo } from "react";
import { SnackContext } from "../../../contexts/SnackContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { TeacherContext } from "../../../contexts/TeacherContext";
import { useRouter } from "next/router";
import { useMarksTable } from "../../../hooks/useFetchGroup";
import { useConfirmation } from "../../../hooks/useConfirmation";
import {
  Container,
  Button,
  Modal,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Form,
  Spacer,
  BreadCrumbs,
  InputField,
} from "../../../components";
import { db } from "../../../firebase-config";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import evalForGroupDetailsStyles from "../../../pageStyles/EvalForGroupDetails.module.scss";
import cn from "classnames/bind";

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
  bonusPoints: number;
  penaltyPoints: number;
  studentId: string;
  evaluationId: string;
  groupId: string;
}

const cx = cn.bind(evalForGroupDetailsStyles);

const roundNum = (value: number, nbDecimals: number) => {
  if (value) {
    return Math.round((value + Number.EPSILON) * 10 ** nbDecimals) / 10 ** nbDecimals;
  } else {
    return "";
  }
};

const genId = (idLength?: number) => {
  const arr = new Uint8Array((idLength || 20) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (dec) => dec.toString(16).padStart(2, "0")).join("");
};

export default function EvalForGroupDetails() {
  const router = useRouter();
  const { groupId, evalId } = router.query as { evalId: string; groupId: string };
  const { haveASnack } = useContext(SnackContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { evaluationMap, groupMap } = useContext(TeacherContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();

  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | undefined>();
  const [currentCopyId, setCurrentCopyId] = useState("");
  const [currentPointsObtained, setCurrentPointsObtained] = useState<number[]>([]);
  const [currentPrevMark, setCurrentPrevMark] = useState(0);
  const [currentPrevMarkOutOf20, setCurrentPrevMarkOutOf20] = useState(0);
  const [currentMinMark, setCurrentMinMark] = useState<number>(Infinity);
  const [currentMaxMark, setCurrentMaxMark] = useState<number>(-Infinity);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [penaltyPoints, setPenaltyPoints] = useState(0);

  const group = useMemo(() => groupMap[groupId], [groupMap, groupId]);
  const evaluation = useMemo(() => evaluationMap[evalId], [evaluationMap, evalId]);

  const totalPointsObtained = useMemo(
    () =>
      currentPointsObtained.reduce((sum, newVal) => {
        return newVal ? sum + newVal : sum;
      }, 0),
    [currentPointsObtained]
  );

  const currentMark = useMemo(
    () => totalPointsObtained + bonusPoints - penaltyPoints,
    [totalPointsObtained, bonusPoints, penaltyPoints]
  );

  const currentMarkOutOf20 = useMemo(
    () => (evaluation ? (currentMark * 20) / evaluation.totalPoints : 0),
    [evaluation, currentMark]
  );

  const addCopy = useCallback((student: Student, min: number, max: number) => {
    setCurrentStudent(student);
    setCurrentMinMark(min);
    setCurrentMaxMark(max);
    setShowAddCopyModal(true);
  }, []);

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
            [`studentMap.${student.id}.subjectAverageOutOf20`]: noMoreCopies
              ? null
              : newSubjectAverageOutOf20,
            [`studentMap.${student.id}.subjectPointsSum`]: newSubjectPointsSum,
            [`studentMap.${student.id}.subjectWeightTotal`]: newSubjectWeightTotal,
          };

          const oldEvalStatistics = group.evalStatistics[evalId];
          const oldCopyNb = oldEvalStatistics.copyNb;
          const oldTotalPoints = oldEvalStatistics.totalPoints;

          const newCopyNb = oldCopyNb - 1;
          const newTotalPoints = oldTotalPoints - studentCopy.mark;
          const newAverage = newTotalPoints / newCopyNb;
          const newAverageOutOf20 = (newAverage * 20) / evaluation.totalPoints;
          const newMinMark = min;
          const newMinMarkOutOf20 = (newMinMark * 20) / evaluation.totalPoints;
          const newMaxMark = max;
          const newMaxMarkOutOf20 = (newMaxMark * 20) / evaluation.totalPoints;

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
    [evaluation, group, groupId, evalId, haveASnack, promptConfirmation]
  );

  const prefillForm = useCallback((copy: Copy) => {
    setIsEditing(true);
    setCurrentCopyId(copy.id);
    setCurrentPointsObtained(copy.pointsObtained);
    setBonusPoints(copy.bonusPoints);
    setPenaltyPoints(copy.penaltyPoints);
    setCurrentPrevMark(copy.mark);
    setCurrentPrevMarkOutOf20(copy.markOutOf20);
  }, []);

  const { marksTableTemplate, notFound } = useMarksTable(addCopy, deleteCopy, prefillForm);
  const evalStatistics = useMemo(
    () =>
      !notFound &&
      !!group.evalStatistics[evalId] &&
      Object.values(group.evalStatistics[evalId]).length !== 0 &&
      group.evalStatistics[evalId],
    [notFound, group, evalId]
  );

  const handleAddCopyModalClose = useCallback(() => {
    setIsEditing(false);
    setCurrentCopyId("");
    setCurrentStudent(undefined);
    setCurrentPointsObtained([]);
    setCurrentPrevMark(0);
    setCurrentPrevMarkOutOf20(0);
    setCurrentMinMark(Infinity);
    setCurrentMaxMark(-Infinity);
    setBonusPoints(0);
    setPenaltyPoints(0);
    setShowAddCopyModal(false);
  }, []);

  const giveAllPoints = useCallback(() => {
    const newPoints = [...evaluation.scale];
    setCurrentPointsObtained(newPoints);
  }, [evaluation]);

  const addCopySubmit = useCallback(async () => {
    const copyToSend = {
      id: currentCopyId || genId(),
      pointsObtained: currentPointsObtained,
      mark: currentMark,
      markOutOf20: currentMarkOutOf20,
      bonusPoints,
      penaltyPoints,
      studentId: currentStudent.id,
      evaluationId: evalId,
      groupId: groupId,
    };

    await updateDoc(doc(db, "evaluations", evalId), {
      [`copies.${groupId}.${currentStudent.id}`]: copyToSend,
    });

    const oldPointsSum = currentStudent.subjectPointsSum ? currentStudent.subjectPointsSum : 0;
    const oldWeightTotal = currentStudent.subjectWeightTotal
      ? currentStudent.subjectWeightTotal
      : 0;

    const newWeightTotal = oldWeightTotal + (isEditing ? 0 : evaluation.coefficient);
    const newPointsSum =
      oldPointsSum -
      (isEditing ? currentPrevMarkOutOf20 * evaluation.coefficient : 0) +
      currentMarkOutOf20 * evaluation.coefficient;
    const newStudentAverage = newPointsSum / newWeightTotal;

    const newStudentMarkSummary = {
      [`studentMap.${currentStudent.id}.subjectAverageOutOf20`]: newStudentAverage,
      [`studentMap.${currentStudent.id}.subjectPointsSum`]: newPointsSum,
      [`studentMap.${currentStudent.id}.subjectWeightTotal`]: newWeightTotal,
    };

    const oldEvalStatistics = group.evalStatistics[evalId];
    const oldTotalPoints =
      oldEvalStatistics && oldEvalStatistics.totalPoints ? oldEvalStatistics.totalPoints : 0;
    const oldCopyNb = oldEvalStatistics && oldEvalStatistics.copyNb ? oldEvalStatistics.copyNb : 0;
    const oldMinMark = currentMinMark;
    const oldMinMarkOutOf20 = (currentMinMark * 20) / evaluation.totalPoints;
    const oldMaxMark = currentMaxMark;
    const oldMaxMarkOutOf20 = (currentMaxMark * 20) / evaluation.totalPoints;

    const newTotalPoints = oldTotalPoints - (isEditing ? currentPrevMark : 0) + currentMark;
    const newCopyNb = oldCopyNb + (isEditing ? 0 : 1);
    const newAverage = newTotalPoints / newCopyNb;
    const newAverageOutOf20 = (newAverage * 20) / evaluation.totalPoints;
    const newMinMark = currentMark < oldMinMark ? currentMark : oldMinMark;
    const newMinMarkOutOf20 = currentMark < oldMinMark ? currentMarkOutOf20 : oldMinMarkOutOf20;
    const newMaxMark = currentMark > oldMaxMark ? currentMark : oldMaxMark;
    const newMaxMarkOutOf20 = currentMark > oldMaxMark ? currentMarkOutOf20 : oldMaxMarkOutOf20;

    const evalStatistics = {
      average: newAverage,
      averageOutOf20: newAverageOutOf20,
      totalPoints: newTotalPoints,
      copyNb: newCopyNb,
      minMark: newMinMark,
      minMarkOutOf20: newMinMarkOutOf20,
      maxMark: newMaxMark,
      maxMarkOutOf20: newMaxMarkOutOf20,
    };

    await updateDoc(doc(db, "groups", groupId), {
      ...newStudentMarkSummary,
      [`evalStatistics.${evalId}`]: evalStatistics,
    });

    haveASnack(
      "success",
      <h6>
        La copie de {currentStudent.firstName} {currentStudent.lastName} a bien été enregistrée !
      </h6>
    );
    handleAddCopyModalClose();
  }, [
    isEditing,
    currentStudent,
    currentCopyId,
    currentPointsObtained,
    currentMark,
    currentMarkOutOf20,
    currentPrevMark,
    currentPrevMarkOutOf20,
    currentMinMark,
    currentMaxMark,
    bonusPoints,
    penaltyPoints,
    evaluation,
    group,
    evalId,
    groupId,
    handleAddCopyModalClose,
    haveASnack,
  ]);

  const resultsTemplate =
    evaluation &&
    [...Array(evaluation.nbQuestions).keys()].map((qNb) => (
      <div key={`question-${qNb}-container`} className={cx("questionInput")}>
        <p className={cx("questionText")}>Question {qNb + 1} :</p>
        <div className={cx("radioButtonsContainer")}>
          {[...Array(evaluation.scale[qNb] / evaluation.markPrecision + 1).keys()]
            .map((i) => i * evaluation.markPrecision)
            .map((i) => (
              <div key={`question-${qNb}-result-${i}`} className={cx("radioButton")}>
                <label>
                  <input
                    type="radio"
                    name={`question-${qNb}`}
                    value={i}
                    checked={i === currentPointsObtained[qNb]}
                    onChange={() => {
                      setCurrentPointsObtained((prev) => {
                        let copy = [...prev];
                        copy[qNb] = i;
                        return copy;
                      });
                    }}
                    required
                  />
                  {i}
                </label>
              </div>
            ))}
        </div>
      </div>
    ));

  const breadCrumbItems = useMemo<[string, string][]>(
    () =>
      group && evaluation
        ? [
            ["Groupes", "/groups"],
            [
              `${group.name} - ${group.actualSubject.slice(0, 3)} - ${group.shortenedLevel} - ${
                group.shortenedSchoolYear
              }`,
              `/groups/${group.id}`,
            ],
            [evaluation.title, `/groups/${groupId}/${evalId}`],
          ]
        : [],
    [group, groupId, evalId, evaluation]
  );

  return (
    <Container className={cx("evalForGroupDetails")}>
      {notFound && (
        <h3 className={cx("groupNotFound")}>
          Oups ! Le groupe ou l&rsquo;évaluation n&rsquo;existent pas, ou bien vous n&rsquo;avez pas
          la permission de consulter leurs détails ! Vérifiez que vous êtes bien connecté !
        </h3>
      )}
      {!notFound && (
        <>
          <BreadCrumbs items={breadCrumbItems} namespace="EvaluationDetailsForGroup" />
          <h1 className="pageTitle text-center">
            {evaluation && `${evaluation.title} - `}Détails de l&rsquo;évaluation
            {group && ` pour ${group.name} ${group.schoolYear}`}
          </h1>

          {evalStatistics && <h2>Vue d&rsquo;ensemble des résultats</h2>}

          {evaluation && evalStatistics && (
            <ul className={cx("evalStatistics")}>
              <li>
                Moyenne du groupe : {roundNum(evalStatistics.average, 2)} / {evaluation.totalPoints}
                {evaluation.totalPoints !== 20 &&
                  ` - ${roundNum(evalStatistics.averageOutOf20, 2)} / 20`}
              </li>
              <li>
                Note minimale : {roundNum(evalStatistics.minMark, 2)} / {evaluation.totalPoints}
                {evaluation.totalPoints !== 20 &&
                  ` - ${roundNum(evalStatistics.minMarkOutOf20, 2)} / 20`}
              </li>
              <li>
                Note maximale : {roundNum(evalStatistics.maxMark, 2)} / {evaluation.totalPoints}
                {evaluation.totalPoints !== 20 &&
                  ` - ${roundNum(evalStatistics.maxMarkOutOf20, 2)} / 20`}
              </li>
            </ul>
          )}

          <h2>Liste des notes par élève</h2>

          {marksTableTemplate}
        </>
      )}

      <Modal showModal={showAddCopyModal}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={addCopySubmit}>
            <CardHeader
              title={<h2>{isEditing ? "Modifier une copie" : "Ajouter une copie"}</h2>}
              centerTitle
            />

            <CardContent>
              <p className={cx("studentInQuestion")}>
                Élève : {currentStudent && `${currentStudent.firstName} ${currentStudent.lastName}`}
              </p>
              {resultsTemplate}
              <div className={cx("bonusPenalty")}>
                <InputField
                  type="select"
                  label="Points bonus"
                  prependIcon="add_circle"
                  selectItems={[
                    ["0", "0"],
                    ["0.5", "0.5"],
                    ["1", "1"],
                    ["1.5", "1.5"],
                    ["2", "2"],
                  ]}
                  setValue={(newVal) => setBonusPoints(Number(newVal))}
                  value={bonusPoints.toString()}
                />
                <InputField
                  type="select"
                  label="Points malus"
                  prependIcon="cancel"
                  selectItems={[
                    ["0", "0"],
                    ["0.5", "0.5"],
                    ["1", "1"],
                    ["1.5", "1.5"],
                    ["2", "2"],
                  ]}
                  setValue={(newVal) => setPenaltyPoints(Number(newVal))}
                  value={penaltyPoints.toString()}
                />
              </div>
              {evaluation && (
                <p>
                  Note : {totalPointsObtained} {bonusPoints !== 0 && `+ ${bonusPoints} `}
                  {penaltyPoints !== 0 && `- ${penaltyPoints} `}/ {evaluation.totalPoints}
                  {evaluation.totalPoints !== 20 &&
                    ` | Note sur 20 : ${roundNum(currentMarkOutOf20, 2)} / 20`}
                </p>
              )}
            </CardContent>

            <CardActions>
              <Button
                type="text"
                className="teal--text"
                prependIcon="done_all"
                onClick={giveAllPoints}
              >
                Note max
              </Button>
              <Spacer />
              <Button className="red--text mr-4" type="outlined" onClick={handleAddCopyModalClose}>
                Annuler
              </Button>
              <Button
                className="blue darken-3"
                isDisabled={
                  !isAuthenticated ||
                  (evaluation && currentPointsObtained.length !== evaluation.nbQuestions)
                }
                formSubmit
              >
                Valider
              </Button>
            </CardActions>
          </Form>
        </Card>
      </Modal>

      {confirmModalTemplate}
    </Container>
  );
}
