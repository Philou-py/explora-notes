import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { SnackContext } from "../../../contexts/SnackContext";
import { AuthContext } from "../../../contexts/AuthContext";
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
} from "../../../components";
import { db } from "../../../firebase-config";
import {
  doc,
  onSnapshot,
  DocumentReference,
  addDoc,
  setDoc,
  collection,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import evalForGroupDetailsStyles from "../../../pageStyles/EvalForGroupDetails.module.scss";
import cn from "classnames/bind";

interface Evaluation {
  id: string;
  creationDate: string;
  title: string;
  totalPoints: number;
  nbQuestions: number;
  scale: number[];
  markPrecision: number;
  coefficient: number;
  associatedGroupIds: string[];
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

interface StudentMark {
  mark?: number;
  markOutOf20?: number;
  totalPoints: number;
  pointsObtained: number[];
  copyId: string;
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

const cx = cn.bind(evalForGroupDetailsStyles);

const roundNum = (value: number, nbDecimals: number) => {
  if (value) {
    return Math.round((value + Number.EPSILON) * 10 ** nbDecimals) / 10 ** nbDecimals;
  } else {
    return "";
  }
};

export default function EvalForGroupDetails() {
  const router = useRouter();
  const { groupId, evalId } = router.query as { evalId: string; groupId: string };
  const { haveASnack } = useContext(SnackContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();

  const [evaluation, setEvaluation] = useState<Evaluation | undefined>();
  const [evalNotFound, setEvalNotFound] = useState(false);
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | undefined>();
  const [currentCopyId, setCurrentCopyId] = useState("");
  const [currentPointsObtained, setCurrentPointsObtained] = useState<number[]>([]);
  const [currentPrevMark, setCurrentPrevMark] = useState(0);
  const [currentPrevMarkOutOf20, setCurrentPrevMarkOutOf20] = useState(0);
  const [currentMinMark, setCurrentMinMark] = useState<number>(Infinity);
  const [currentMaxMark, setCurrentMaxMark] = useState<number>(-Infinity);

  const totalPointsObtained = useMemo(
    () =>
      currentPointsObtained.reduce((sum, newVal) => {
        return newVal ? sum + newVal : sum;
      }, 0),
    [currentPointsObtained]
  );

  const currentMarkOutOf20 = useMemo(
    () => (evaluation ? (totalPointsObtained * 20) / evaluation.totalPoints : 0),
    [evaluation, totalPointsObtained]
  );

  const addCopy = useCallback((student: Student, min: number, max: number) => {
    setCurrentStudent(student);
    setCurrentMinMark(min);
    setCurrentMaxMark(max);
    setShowAddCopyModal(true);
  }, []);

  const deleteCopy = useCallback(
    (student: Student, studentMark: StudentMark, group: Group, min: number, max: number) => {
      promptConfirmation(
        `Confirmez-vous vouloir supprimer la copie de ${student.firstName} ${student.lastName} ?`,
        async () => {
          await deleteDoc(doc(db, "copies", studentMark.copyId));
          const oldStudentMarkSummary = student.studentMarkSummary;
          const oldSubjectPointsSum = oldStudentMarkSummary.subjectPointsSum;
          const oldSubjectWeightTotal = oldStudentMarkSummary.subjectWeightTotal;

          const newSubjectPointsSum = oldSubjectPointsSum - studentMark.markOutOf20;
          const newSubjectWeightTotal = oldSubjectWeightTotal - evaluation.coefficient;
          const newSubjectAverageOutOf20 = newSubjectPointsSum / newSubjectWeightTotal;

          const newStudentMarkSummary = {
            ...(newSubjectWeightTotal !== 0 && {
              subjectAverageOutOf20: newSubjectAverageOutOf20,
              subjectPointsSum: newSubjectPointsSum,
              subjectWeightTotal: newSubjectWeightTotal,
            }),
          };

          const oldEvalStatistics = group.evalStatistics[evalId];
          const oldCopyNb = oldEvalStatistics.copyNb;
          const oldTotalPoints = oldEvalStatistics.totalPoints;

          const newCopyNb = oldCopyNb - 1;
          const newTotalPoints = oldTotalPoints - studentMark.mark;
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
            [`studentMarkSummaries.${student.id}`]: newStudentMarkSummary,
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
    [evaluation, groupId, evalId, haveASnack, promptConfirmation]
  );

  const prefillForm = useCallback((studentMark: StudentMark, copyId: string) => {
    setIsEditing(true);
    setCurrentCopyId(copyId);
    setCurrentPointsObtained(studentMark.pointsObtained);
    setCurrentPrevMark(studentMark.mark);
    setCurrentPrevMarkOutOf20(studentMark.markOutOf20);
  }, []);

  const { group, marksTableTemplate, evalStatistics, groupNotFound } = useMarksTable(
    addCopy,
    deleteCopy,
    prefillForm
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
    setShowAddCopyModal(false);
  }, []);

  const getEvaluation = useCallback(() => {
    if (evalId) {
      const evaluationRef = doc(db, "evaluations", evalId) as DocumentReference<Evaluation>;
      const evalUnsub = onSnapshot(evaluationRef, (docSnapshot) => {
        if (docSnapshot.exists) {
          const docData = docSnapshot.data();
          if (!groupNotFound && docData.associatedGroupIds.includes(groupId)) {
            setEvaluation({ id: docSnapshot.id, ...docData });
            setEvalNotFound(false);
            return;
          }
        }
        setEvaluation(undefined);
        setEvalNotFound(true);
      });
      return evalUnsub;
    }
  }, [evalId, groupId, groupNotFound]);

  useEffect(() => getEvaluation(), [getEvaluation]);

  const addCopySubmit = useCallback(async () => {
    const copyToSend = {
      pointsObtained: currentPointsObtained,
      mark: totalPointsObtained,
      markOutOf20: currentMarkOutOf20,
      totalPoints: evaluation.totalPoints,
      coefficient: evaluation.coefficient,
      studentId: currentStudent.id,
      evaluationId: evalId,
      groupId: groupId,
    };

    if (isEditing) {
      await setDoc(doc(db, "copies", currentCopyId), copyToSend);
    } else {
      await addDoc(collection(db, "copies"), copyToSend);
    }

    const studentMarkSummary = currentStudent.studentMarkSummary;
    const oldPointsSum =
      studentMarkSummary && studentMarkSummary.subjectPointsSum
        ? studentMarkSummary.subjectPointsSum
        : 0;
    const oldWeightTotal =
      studentMarkSummary && studentMarkSummary.subjectWeightTotal
        ? studentMarkSummary.subjectWeightTotal
        : 0;

    const newWeightTotal = oldWeightTotal + (isEditing ? 0 : evaluation.coefficient);
    const newPointsSum =
      oldPointsSum -
      (isEditing ? currentPrevMarkOutOf20 * evaluation.coefficient : 0) +
      currentMarkOutOf20 * evaluation.coefficient;
    const newStudentAverage = newPointsSum / newWeightTotal;

    const newStudentMarkSummary = {
      subjectAverageOutOf20: newStudentAverage,
      subjectWeightTotal: newWeightTotal,
      subjectPointsSum: newPointsSum,
    };

    const oldEvalStatistics = group.evalStatistics[evalId];
    const oldTotalPoints =
      oldEvalStatistics && oldEvalStatistics.totalPoints ? oldEvalStatistics.totalPoints : 0;
    const oldCopyNb = oldEvalStatistics && oldEvalStatistics.copyNb ? oldEvalStatistics.copyNb : 0;
    const oldMinMark = currentMinMark;
    const oldMinMarkOutOf20 = (currentMinMark * 20) / evaluation.totalPoints;
    const oldMaxMark = currentMaxMark;
    const oldMaxMarkOutOf20 = (currentMaxMark * 20) / evaluation.totalPoints;

    const newTotalPoints = oldTotalPoints - (isEditing ? currentPrevMark : 0) + totalPointsObtained;
    const newCopyNb = oldCopyNb + (isEditing ? 0 : 1);
    const newAverage = newTotalPoints / newCopyNb;
    const newAverageOutOf20 = (newAverage * 20) / evaluation.totalPoints;
    const newMinMark = totalPointsObtained < oldMinMark ? totalPointsObtained : oldMinMark;
    const newMinMarkOutOf20 =
      totalPointsObtained < oldMinMark
        ? (totalPointsObtained * 20) / evaluation.totalPoints
        : oldMinMarkOutOf20;
    const newMaxMark = totalPointsObtained > oldMaxMark ? totalPointsObtained : oldMaxMark;
    const newMaxMarkOutOf20 =
      totalPointsObtained > oldMaxMark
        ? (totalPointsObtained * 20) / evaluation.totalPoints
        : oldMaxMarkOutOf20;

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
      [`studentMarkSummaries.${currentStudent.id}`]: newStudentMarkSummary,
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
    currentMarkOutOf20,
    currentPrevMark,
    currentPrevMarkOutOf20,
    currentMinMark,
    currentMaxMark,
    totalPointsObtained,
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
            ["Mes groupes", "/groups"],
            [group.name, `/groups/${group.id}`],
            [evaluation.title, `/groups/${groupId}/${evalId}`],
          ]
        : [],
    [group, groupId, evalId, evaluation]
  );

  return (
    <Container className={cx("evalForGroupDetails")}>
      {groupNotFound && (
        <h3 className={cx("groupNotFound")}>
          Oups ! Ce groupe n&rsquo;existe pas, ou bien vous n&rsquo;avez pas la permission de
          consulter son tableau de bord !
        </h3>
      )}
      {!groupNotFound && !evalNotFound && (
        <>
          <BreadCrumbs items={breadCrumbItems} />
          <h1 className="pageTitle text-center">
            {evaluation && `${evaluation.title} - `}Détails de l&rsquo;évaluation
            {group && ` pour ${group.name} ${group.schoolYear}`}
          </h1>

          {evalStatistics && <h2>Vue d&rsquo;ensemble des résultats</h2>}

          {evaluation && evalStatistics && (
            <ul>
              <li>
                Moyenne du groupe : {roundNum(evalStatistics.average, 2)} / {evaluation.totalPoints}{" "}
                - {roundNum(evalStatistics.averageOutOf20, 2)} / 20
              </li>
              <li>
                Note minimale : {roundNum(evalStatistics.minMark, 2)} / {evaluation.totalPoints} -{" "}
                {roundNum(evalStatistics.minMarkOutOf20, 2)} / 20
              </li>
              <li>
                Note maximale : {roundNum(evalStatistics.maxMark, 2)} / {evaluation.totalPoints} -{" "}
                {roundNum(evalStatistics.maxMarkOutOf20, 2)} / 20
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
              {evaluation && (
                <p>
                  Points obtenus : {totalPointsObtained} / {evaluation.totalPoints} | Note sur 20 :{" "}
                  {roundNum(currentMarkOutOf20, 2)} / 20
                </p>
              )}
            </CardContent>

            <CardActions>
              <Spacer />
              <Button className="red--text mr-4" type="outlined" onClick={handleAddCopyModalClose}>
                Annuler
              </Button>
              <Button className="blue darken-3" isDisabled={!isAuthenticated} formSubmit>
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
