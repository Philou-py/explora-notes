import evalStyles from "../pageStyles/Evaluations.module.scss";
import cn from "classnames/bind";
import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { db } from "../firebase-config";
import {
  query,
  collection,
  where,
  onSnapshot,
  CollectionReference,
  addDoc,
} from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import { SnackContext } from "../contexts/SnackContext";
import {
  Container,
  DataTable,
  Modal,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  InputField,
  useForm,
  Button,
  Spacer,
  Form,
} from "../components";

interface TableHeader {
  text: string;
  value: string;
  isSortable?: boolean;
  align?: "start" | "center" | "end";
  alignContent?: "start" | "center" | "end";
  unitSuffix?: string;
}

const cx = cn.bind(evalStyles);

interface Evaluation {
  id: string;
  creationDate: string;
  title: string;
  totalPoints: number;
  nbQuestions: number;
  scale: number[];
  gradePrecision: number;
  subject: string;
  bringBackGradesTo20: boolean;
}

export default function Evaluations() {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const [evaluations, setEvaluations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [nbQuestions, setNbQuestions] = useState(1);
  const [scale, setScale] = useState([1]);
  const [bringBackGradesTo20, setBringBackGradesTo20] = useState(true);
  const {
    data: newEval,
    setData,
    isValid,
    register,
  } = useForm({ title: "", subject: "", gradePrecision: "" });

  const resetForm = useCallback(() => {
    setData({ title: "", subject: "", gradePrecision: "" });
    setNbQuestions(1);
    setScale([1]);
    setBringBackGradesTo20(true);
  }, [setData]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleModalOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleAddQuestion = useCallback(() => {
    setScale((prev) => [...prev, 1]);
    setNbQuestions((prev) => prev + 1);
  }, []);

  const handleRemoveQuestion = useCallback(() => {
    setScale((prev) => prev.slice(0, -1));
    setNbQuestions((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handle20GradesCheck = useCallback(() => {
    setBringBackGradesTo20((prev) => !prev);
  }, []);

  const totalPoints = useMemo(() => scale.reduce((total, newVal) => total + newVal, 0), [scale]);

  const subjects = useMemo(
    () => [
      ["Physique-chimie", "physics"],
      ["ES Physique-chimie", "st-physics"],
      ["Mathématiques", "maths"],
      ["NSI", "it"],
      ["Français", "french"],
      ["Anglais", "english"],
      ["Allemand", "german"],
      ["Italien", "italian"],
      ["Espagnol", "spanish"],
      ["EPS", "sport"],
      ["SES", "economics"],
      ["SVT", "biology"],
      ["ES SVT", "st-biology"],
      ["Histoire-géographie", "history-geography"],
      ["Art-plastique", "arts"],
    ],
    []
  );

  const getSubject = useCallback(
    (sub: string) => {
      for (let i = 0; i < subjects.length; i++) {
        if (subjects[i][1] === sub) {
          return subjects[i][0];
        }
      }
      return "";
    },
    [subjects]
  );

  useEffect(() => {
    if (isAuthenticated) {
      const q = query(
        collection(db, "evaluations") as CollectionReference<Evaluation>,
        where("creator", "==", currentUser.id)
      );

      const queryUnsub = onSnapshot(q, (querySnapshot) => {
        const evals = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          evals.push({
            key: { rawContent: doc.id },
            creationDate: {
              rawContent: docData.creationDate,
              content: new Date(docData.creationDate).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
            title: { rawContent: docData.title },
            subject: { rawContent: docData.subject, content: getSubject(docData.subject) },
            nbQuestions: { rawContent: docData.nbQuestions },
          });
        });
        setEvaluations(evals);
      });

      return queryUnsub;
    }
  }, [currentUser, isAuthenticated, getSubject]);

  const handleSubmit = useCallback(async () => {
    const evaluationToSend = {
      ...newEval,
      gradePrecision: Number(newEval.gradePrecision),
      scale,
      totalPoints,
      nbQuestions,
      creationDate: new Date().toISOString().slice(0, 10),
      bringBackGradesTo20,
      creator: currentUser.id,
    };
    await addDoc(collection(db, "evaluations"), evaluationToSend);
    haveASnack(
      "success",
      <h6>L&rsquo;évaluation &laquo; {newEval.title} &raquo; a bien été créée !</h6>
    );
    handleModalClose();
  }, [
    newEval,
    scale,
    totalPoints,
    nbQuestions,
    currentUser,
    haveASnack,
    bringBackGradesTo20,
    handleModalClose,
  ]);

  const tableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Date de création", value: "creationDate" },
      { text: "Titre", value: "title" },
      { text: "Matière", value: "subject" },
      { text: "Nb de questions", value: "nbQuestions", alignContent: "center" },
    ],
    []
  );

  const scaleTemplate = [...Array(nbQuestions).keys()]
    .map((n) => n + 1)
    .map((qNb: number) => (
      <div key={`question-${qNb}-container`}>
        <p className={cx("questionText")}>Question {qNb} :</p>
        <div className={cx("radioButtonsContainer")}>
          {[...Array(20).keys()]
            .map((i) => (i + 1) / 2)
            .map((i) => (
              <div key={`question-${qNb}-precision-${i}`} className={cx("radioButton")}>
                <label>
                  <input
                    type="radio"
                    name={`question-${qNb}`}
                    value={i}
                    checked={i === scale[qNb - 1]}
                    onChange={() => {
                      setScale((prev) => {
                        let copy = [...prev];
                        copy[qNb - 1] = i;
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

  const precisionsForSelect = useMemo(
    () => [
      ["0.25", "0.25"],
      ["0.5", "0.5"],
      ["1.0", "1.0"],
      ["2.0", "2.0"],
    ],
    []
  );

  return (
    <Container className={cx("evaluations")}>
      <h1 className="page-title text-center">Mes Évaluations</h1>

      <div className={cx("newEvalContainer")}>
        <Button className="blue darken-3 text-center" onClick={handleModalOpen}>
          Nouvelle Évaluation
        </Button>
      </div>

      <DataTable headers={tableHeaders} items={evaluations} />

      <Modal showModal={modalOpen} closeFunc={handleModalClose}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={handleSubmit}>
            <CardHeader title={<h2>Créer une évaluation</h2>} centerTitle />
            <CardContent>
              <fieldset className={cx("generalInfo")}>
                <legend>Informations générales</legend>
                <InputField
                  type="text"
                  label="Titre de l&rsquo;évaluation"
                  prependIcon="title"
                  isRequired
                  {...register("title")}
                />
                <InputField
                  type="select"
                  label="Matière"
                  prependIcon="subject"
                  selectItems={subjects}
                  isRequired
                  {...register("subject")}
                />
                <InputField
                  type="select"
                  label="Précision de la notation"
                  prependIcon="subject"
                  selectItems={precisionsForSelect}
                  isRequired
                  {...register("gradePrecision")}
                />
                <label className={cx("checkboxContainer")}>
                  <input
                    type="checkbox"
                    onChange={handle20GradesCheck}
                    checked={bringBackGradesTo20}
                  />
                  Ramener les notes sur 20
                </label>
              </fieldset>

              <fieldset className={cx("scale")}>
                <legend>Barème</legend>
                <p className={cx("scaleSummary")}>
                  Nombre de questions : {nbQuestions} | Total des points : {totalPoints}
                </p>
                <>{scaleTemplate}</>
                <div className={cx("addIconContainer")}>
                  <Button
                    type="icon"
                    iconName="remove"
                    className="yellow darken-1 mr-4"
                    onClick={handleRemoveQuestion}
                    size="small"
                  />
                  <Button
                    type="icon"
                    iconName="add"
                    className="red darken-1"
                    onClick={handleAddQuestion}
                  />
                </div>
              </fieldset>
            </CardContent>

            <CardActions>
              <Spacer />
              <Button className="red--text mr-4" type="outlined" onClick={handleModalClose}>
                Annuler
              </Button>
              <Button
                className="blue darken-3"
                isDisabled={
                  !isAuthenticated || !isValid || scale.includes(undefined) || nbQuestions === 0
                }
                formSubmit
              >
                Valider
              </Button>
            </CardActions>
          </Form>
        </Card>
      </Modal>
    </Container>
  );
}
