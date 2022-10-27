import { useState, useCallback, useContext, useEffect, useMemo, memo } from "react";
import { SnackContext } from "../contexts/SnackContext";
import { AuthContext } from "../contexts/AuthContext";
import { TeacherContext, Student, Copy } from "../contexts/TeacherContext";
import { useRouter } from "next/router";
import {
  Button,
  Modal,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Form,
  Spacer,
  InputField,
} from "../components";
import { db } from "../firebase-config";
import { doc, updateDoc } from "firebase/firestore";
import manageCopyModalStyles from "../layoutStyles/ManageCopyModal.module.scss";
import cn from "classnames/bind";
import { roundNum } from "../helpers/roundNum";
import { genId } from "../helpers/genId";

const cx = cn.bind(manageCopyModalStyles);

interface ManageCopyModalProps {
  modalOpen: boolean;
  setModalOpen: (newVal: boolean) => void;
  isEditing: boolean;
  currentCopy: Copy;
  currentStudent: Student;
  currentMinMark: number;
  currentMaxMark: number;
}

function ManageCopyModal({
  modalOpen,
  setModalOpen,
  isEditing,
  currentCopy,
  currentStudent,
  currentMinMark,
  currentMaxMark,
}: ManageCopyModalProps) {
  const router = useRouter();
  const { groupId, evalId } = router.query as { evalId: string; groupId: string };
  const { haveASnack } = useContext(SnackContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { evaluationMap, groupMap } = useContext(TeacherContext);

  const [currentPointsObtained, setCurrentPointsObtained] = useState<number[]>([]);
  const [currentPrevMark, setCurrentPrevMark] = useState(0);
  const [currentPrevMarkOutOf20, setCurrentPrevMarkOutOf20] = useState(0);
  const [currentPrevPointsByEx, setCurrentPrevPointsByEx] = useState<number[]>([]);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [penaltyPoints, setPenaltyPoints] = useState(0);

  const group = useMemo(() => groupMap[groupId], [groupMap, groupId]);
  const evaluation = useMemo(() => evaluationMap[evalId], [evaluationMap, evalId]);

  useEffect(() => {
    if (modalOpen) {
      if (isEditing) {
        setCurrentPointsObtained(currentCopy.pointsObtained);
        setBonusPoints(currentCopy.bonusPoints);
        setPenaltyPoints(currentCopy.penaltyPoints);
        setCurrentPrevMark(currentCopy.mark);
        setCurrentPrevMarkOutOf20(currentCopy.markOutOf20);
        setCurrentPrevPointsByEx(currentCopy.pointsByEx);
      }
    } else {
      setCurrentPointsObtained([]);
      setCurrentPrevMark(0);
      setCurrentPrevMarkOutOf20(0);
      setCurrentPrevPointsByEx([]);
      setBonusPoints(0);
      setPenaltyPoints(0);
    }
  }, [modalOpen, currentCopy, isEditing]);

  const totalPointsObtained = useMemo(
    () =>
      currentPointsObtained.reduce((sum, newVal) => {
        return newVal ? sum + newVal : sum;
      }, 0),
    [currentPointsObtained]
  );

  const currentPointsByEx = useMemo(() => {
    if (!evaluation) return [];
    const pointsByEx = evaluation.exercises.map((_) => 0);
    for (let exIndex = 0; exIndex < evaluation.exercises.length; exIndex++) {
      let startQIndex = evaluation.exercises[exIndex];
      let endQIndex =
        exIndex === evaluation.exercises.length - 1
          ? evaluation.nbQuestions
          : evaluation.exercises[exIndex + 1];
      for (let qIndex = startQIndex; qIndex < endQIndex; qIndex++) {
        pointsByEx[exIndex] += currentPointsObtained[qIndex];
      }
    }
    return pointsByEx;
  }, [currentPointsObtained, evaluation]);

  const currentMark = useMemo(
    () => totalPointsObtained + bonusPoints - penaltyPoints,
    [totalPointsObtained, bonusPoints, penaltyPoints]
  );

  const currentMarkOutOf20 = useMemo(
    () => (evaluation ? (currentMark * 20) / evaluation.totalPoints : 0),
    [evaluation, currentMark]
  );

  const giveAllPoints = useCallback(() => {
    const newPoints = [...evaluation.scale];
    setCurrentPointsObtained(newPoints);
  }, [evaluation]);

  const addCopySubmit = useCallback(async () => {
    const copyToSend = {
      id: (currentCopy && currentCopy.id) || genId(),
      pointsObtained: currentPointsObtained,
      pointsByEx: currentPointsByEx,
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
    const oldExTotPts =
      oldEvalStatistics && oldEvalStatistics.exerciseTotalPoints
        ? oldEvalStatistics.exerciseTotalPoints
        : evaluation.exercises.map((_) => 0);

    const newTotalPoints = oldTotalPoints - (isEditing ? currentPrevMark : 0) + currentMark;
    const newCopyNb = oldCopyNb + (isEditing ? 0 : 1);
    const newAverage = newTotalPoints / newCopyNb;
    const newAverageOutOf20 = (newAverage * 20) / evaluation.totalPoints;
    const newMinMark = currentMark < oldMinMark ? currentMark : oldMinMark;
    const newMinMarkOutOf20 = currentMark < oldMinMark ? currentMarkOutOf20 : oldMinMarkOutOf20;
    const newMaxMark = currentMark > oldMaxMark ? currentMark : oldMaxMark;
    const newMaxMarkOutOf20 = currentMark > oldMaxMark ? currentMarkOutOf20 : oldMaxMarkOutOf20;
    const newExTotPts = oldExTotPts.map(
      (oldExPoints, exIndex) =>
        oldExPoints - (isEditing ? currentPrevPointsByEx[exIndex] : 0) + currentPointsByEx[exIndex]
    );
    const newExAvs = newExTotPts.map((exTotPts) => exTotPts / newCopyNb);

    const evalStatistics = {
      average: newAverage,
      averageOutOf20: newAverageOutOf20,
      totalPoints: newTotalPoints,
      copyNb: newCopyNb,
      minMark: newMinMark,
      minMarkOutOf20: newMinMarkOutOf20,
      maxMark: newMaxMark,
      maxMarkOutOf20: newMaxMarkOutOf20,
      exerciseAverages: newExAvs,
      exerciseTotalPoints: newExTotPts,
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
    setModalOpen(false);
  }, [
    isEditing,
    currentStudent,
    currentCopy,
    currentPointsObtained,
    currentPointsByEx,
    currentMark,
    currentMarkOutOf20,
    currentPrevMark,
    currentPrevMarkOutOf20,
    currentPrevPointsByEx,
    currentMinMark,
    currentMaxMark,
    bonusPoints,
    penaltyPoints,
    evaluation,
    group,
    evalId,
    groupId,
    haveASnack,
    setModalOpen,
  ]);

  const currEx = (qNb: number) =>
    evaluation.exercises.reduce((prev, curr) => (curr <= qNb ? prev + 1 : prev), -1);

  const resultsTemplate =
    evaluation &&
    [...Array(evaluation.nbQuestions).keys()].map((qNb) => (
      <div key={`question-${qNb}-container`} className={cx("questionInput")}>
        {evaluation.exercises.includes(qNb) && (
          <p className={cx("exerciseText")}>Exercice {evaluation.exercises.indexOf(qNb) + 1}</p>
        )}
        <p className={cx("questionText")}>
          Question{" "}
          {evaluation.exercises.reduce((prev, curr) => (curr <= qNb ? qNb - curr + 1 : prev), 0)} :
        </p>
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
        {(qNb === evaluation.nbQuestions - 1 || evaluation.exercises.includes(qNb + 1)) && (
          <p className={cx("exerciseSummaryText")}>
            Points obtenus à l&rsquo;exercice {currEx(qNb) + 1} : {currentPointsByEx[currEx(qNb)]} /{" "}
            {evaluation.exerciseScale[currEx(qNb)]}
          </p>
        )}
      </div>
    ));

  return (
    <Modal showModal={modalOpen}>
      <Card cssWidth="clamp(50px, 500px, 95%)" className={cx("manageCopyModal")}>
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
            <Button className="red--text mr-4" type="outlined" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              className="blue darken-3"
              isDisabled={
                !isAuthenticated ||
                (evaluation &&
                  (currentPointsObtained.length !== evaluation.nbQuestions ||
                    currentPointsObtained.includes(undefined)))
              }
              formSubmit
            >
              Valider
            </Button>
          </CardActions>
        </Form>
      </Card>
    </Modal>
  );
}

export default memo(ManageCopyModal);
