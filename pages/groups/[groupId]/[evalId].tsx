import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { SnackContext } from "../../../contexts/SnackContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { useRouter } from "next/router";
import { useMarksTable } from "../../../hooks/useFetchGroup";
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
  subjectAverage: number;
  subjectMarkNb: number;
  subjectPointsSum: number;
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

  const [evaluation, setEvaluation] = useState<Evaluation | undefined>();
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | undefined>();
  const [currentCopyId, setCurrentCopyId] = useState("");
  const [currentPointsObtained, setCurrentPointsObtained] = useState<number[]>([]);
  const [currentPrevMarkOutOf20, setCurrentPrevMarkOutOf20] = useState(0);

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

  const addCopy = useCallback((student: Student) => {
    setCurrentStudent(student);
    setShowAddCopyModal(true);
  }, []);

  const deleteCopy = useCallback((_studentId: string) => {}, []);

  const prefillForm = useCallback((studentMark: StudentMark, copyId: string) => {
    setIsEditing(true);
    setCurrentCopyId(copyId);
    setCurrentPointsObtained(studentMark.pointsObtained);
    setCurrentPrevMarkOutOf20(studentMark.markOutOf20);
  }, []);

  const { group, marksTableTemplate } = useMarksTable(addCopy, deleteCopy, prefillForm);

  const handleAddCopyModalClose = useCallback(() => {
    setIsEditing(false);
    setCurrentCopyId("");
    setCurrentStudent(undefined);
    setCurrentPointsObtained([]);
    setCurrentPrevMarkOutOf20(0);
    setShowAddCopyModal(false);
  }, []);

  const getEvaluation = useCallback(() => {
    if (evalId) {
      const evaluationRef = doc(db, "evaluations", evalId) as DocumentReference<Evaluation>;
      const evalUnsub = onSnapshot(evaluationRef, (docSnapshot) => {
        if (docSnapshot.exists) {
          const docData = docSnapshot.data();
          setEvaluation({ id: docSnapshot.id, ...docData });
        }
      });
      return evalUnsub;
    }
  }, [evalId]);

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

    let studentIdsAndAverages = [...group.studentIdsAndAverages];
    const oldAverageIndex = studentIdsAndAverages.findIndex((st) => st.id === currentStudent.id);
    const oldPointsSum = currentStudent.subjectPointsSum;
    const oldNbMarks = currentStudent.subjectMarkNb;

    studentIdsAndAverages.splice(oldAverageIndex, 1);

    const newNbMarks = oldNbMarks + (isEditing ? 0 : evaluation.coefficient);
    const newPointsSum =
      oldPointsSum -
      (isEditing ? currentPrevMarkOutOf20 * evaluation.coefficient : 0) +
      currentMarkOutOf20 * evaluation.coefficient;
    const newAverage = newPointsSum / newNbMarks;

    studentIdsAndAverages.push({
      id: currentStudent.id,
      subjectAverage: newAverage,
      subjectMarkNb: newNbMarks,
      subjectPointsSum: newPointsSum,
    });

    await updateDoc(doc(db, "groups", groupId), { studentIdsAndAverages });

    haveASnack(
      "success",
      <h6>
        La copie de l&rsquo;élève &laquo; {currentStudent.firstName} {currentStudent.lastName}{" "}
        &raquo; a bien été enregistrée !
      </h6>
    );
    handleAddCopyModalClose();
  }, [
    isEditing,
    currentStudent,
    currentCopyId,
    currentPointsObtained,
    currentMarkOutOf20,
    currentPrevMarkOutOf20,
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

  return (
    <Container className={cx("evalForGroupDetails")}>
      <h1 className="pageTitle text-center">
        {evaluation && `${evaluation.title} - `}Détails de l&rsquo;évaluation
        {group && ` pour « ${group.name} »`}
      </h1>
      {marksTableTemplate}

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
    </Container>
  );
}
