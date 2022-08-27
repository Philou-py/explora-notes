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
  deleteDoc,
  doc,
  updateDoc,
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
  SortOrder,
} from "../components";
import { useConfirmation } from "../hooks/useConfirmation";

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
  coefficient: number;
  associatedGroupIds: string[];
}

interface Group {
  id: string;
  teacher: string;
  schoolYear: string;
  name: string;
  nbStudents: number;
  subject: string;
}

export default function Evaluations() {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();

  const [rawEvals, setRawEvals] = useState<Evaluation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [addEvalModalOpen, setAddEvalModalOpen] = useState(false);
  const [bindToGrModalOpen, setBindToGrModalOpen] = useState(false);
  const [currentEvalToBind, setCurrentEvalToBind] = useState({ id: "", name: "" });
  const [currentGroups, setCurrentGroups] = useState<string[]>([""]);
  const [nbCurrentGroups, setNbCurrentGroups] = useState(1);
  const [nbQuestions, setNbQuestions] = useState(1);
  const [scale, setScale] = useState([1]);
  const {
    data: newEval,
    setData,
    isValid,
    register,
  } = useForm({ title: "", gradePrecision: "0.5", coefficient: "1.0" });

  const resetForm = useCallback(() => {
    setData({ title: "", gradePrecision: "0.5", coefficient: "1.0" });
    setNbQuestions(1);
    setScale([1]);
  }, [setData]);

  const handleAddEvalModalClose = useCallback(() => {
    setAddEvalModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleAddEvalModalOpen = useCallback(() => {
    setAddEvalModalOpen(true);
  }, []);

  const handleBindToGrModalClose = useCallback(() => {
    setBindToGrModalOpen(false);
  }, []);

  const handleBindToGrModalOpen = useCallback(() => {
    setBindToGrModalOpen(true);
  }, []);

  const handleAddQuestion = useCallback(() => {
    setScale((prev) => [...prev, 1]);
    setNbQuestions((prev) => prev + 1);
  }, []);

  const handleRemoveQuestion = useCallback(() => {
    if (nbQuestions > 1) {
      setScale((prev) => prev.slice(0, -1));
      setNbQuestions((prev) => prev - 1);
    }
  }, [nbQuestions]);

  const totalPoints = useMemo(() => scale.reduce((total, newVal) => total + newVal, 0), [scale]);

  const handleAddCurrentGroup = useCallback(() => {
    setCurrentGroups((prev) => [...prev, ""]);
    setNbCurrentGroups((prev) => prev + 1);
  }, []);

  const handleRemoveCurrentGroup = useCallback(() => {
    if (nbCurrentGroups !== 0) {
      setCurrentGroups((prev) => prev.slice(0, -1));
      setNbCurrentGroups((prev) => prev - 1);
    }
  }, [nbCurrentGroups]);

  const getGroupName = useCallback(
    (groupId: string) => {
      return groups.filter((g) => g.id === groupId)[0].name;
    },
    [groups]
  );

  const handleDeleteEvaluation = useCallback(
    (evalId: string) => {
      promptConfirmation(
        "Voulez-vous supprimer cette évaluation de manière définitive ?",
        async () => {
          // TODO: Delete associated copies for each student
          await deleteDoc(doc(db, "evaluations", evalId));
          haveASnack("success", <h6>L&rsquo;évaluation a bien été supprimée !</h6>);
        }
      );
    },
    [haveASnack, promptConfirmation]
  );

  const evaluations = useMemo(
    () =>
      rawEvals.map((rawEval) => ({
        key: { rawContent: rawEval.id },
        creationDate: {
          rawContent: rawEval.creationDate,
          content: new Date(rawEval.creationDate).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
        title: { rawContent: rawEval.title },
        nbQuestions: { rawContent: rawEval.nbQuestions },
        coefficient: { rawContent: rawEval.coefficient },
        associatedGroups: {
          rawContent: rawEval.associatedGroupIds.map((id) => getGroupName(id)).join(", "),
        },
        actions: {
          rawContent: "",
          content: [
            <Button
              type="icon"
              size="small"
              iconName="group_add"
              className="purple--text"
              key={`eval-${rawEval.id}-bind`}
              onClick={() => {
                const gNb = rawEval.associatedGroupIds.length;
                setCurrentEvalToBind({ id: rawEval.id, name: rawEval.title });
                setCurrentGroups(gNb > 0 ? rawEval.associatedGroupIds : [""]);
                setNbCurrentGroups(gNb > 0 ? gNb : 1);
                handleBindToGrModalOpen();
              }}
              isFlat
            />,
            <Button
              type="icon"
              size="small"
              iconName="delete"
              className="red--text ml-1"
              key={`eval-${rawEval.id}-delete`}
              onClick={() => {
                handleDeleteEvaluation(rawEval.id);
              }}
              isFlat
            />,
          ],
        },
      })),
    [getGroupName, handleBindToGrModalOpen, handleDeleteEvaluation, rawEvals]
  );

  const handleSubmit = useCallback(async () => {
    const evaluationToSend = {
      ...newEval,
      gradePrecision: Number(newEval.gradePrecision),
      coefficient: Number(newEval.coefficient),
      scale,
      totalPoints,
      nbQuestions,
      creationDate: new Date().toISOString(),
      creator: currentUser.id,
      associatedGroupIds: [],
    };
    await addDoc(collection(db, "evaluations"), evaluationToSend);
    haveASnack(
      "success",
      <h6>L&rsquo;évaluation &laquo; {newEval.title} &raquo; a bien été créée !</h6>
    );
    handleAddEvalModalClose();
  }, [newEval, scale, totalPoints, nbQuestions, currentUser, haveASnack, handleAddEvalModalClose]);

  const handleBindToGrSubmit = useCallback(async () => {
    const evalRef = doc(db, "evaluations", currentEvalToBind.id);
    await updateDoc(evalRef, { associatedGroupIds: currentGroups });
    haveASnack(
      "success",
      <h6>
        Les groupes associés à l&rsquo;évaluation &laquo; {currentEvalToBind.name} &raquo; ont bien
        été mis à jour !
      </h6>
    );
    handleBindToGrModalClose();
  }, [currentGroups, currentEvalToBind, haveASnack, handleBindToGrModalClose]);

  useEffect(() => {
    if (isAuthenticated) {
      const qEvals = query(
        collection(db, "evaluations") as CollectionReference<Evaluation>,
        where("creator", "==", currentUser.id)
      );

      const queryUnsub = onSnapshot(qEvals, (querySnapshot) => {
        const evals = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          evals.push({ id: doc.id, ...docData });
        });
        setRawEvals(evals);
      });

      const qGroups = query(
        collection(db, "groups") as CollectionReference<Group>,
        where("teacher", "==", currentUser.id)
      );

      const queryGroupUnsub = onSnapshot(qGroups, (querySnapshot) => {
        const receivedGroups = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          receivedGroups.push({ id: doc.id, ...docData });
        });
        setGroups(receivedGroups);
      });

      return () => {
        queryUnsub();
        queryGroupUnsub();
      };
    }
  }, [currentUser, isAuthenticated]);

  const tableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Date de création", value: "creationDate" },
      { text: "Titre", value: "title" },
      { text: "Nb de questions", value: "nbQuestions", alignContent: "center" },
      { text: "Coefficient", value: "coefficient", alignContent: "center" },
      { text: "Groupes associés", value: "associatedGroups", alignContent: "center" },
      { text: "Actions", value: "actions", isSortable: false, alignContent: "center" },
    ],
    []
  );

  const precisionsForSelect = useMemo(
    () => [
      ["0.25", "0.25"],
      ["0.5", "0.5"],
      ["1.0", "1.0"],
      ["2.0", "2.0"],
    ],
    []
  );

  const coefficientForSelect = useMemo(
    () => [
      ["0.5", "0.5"],
      ["1.0", "1.0"],
      ["1.5", "1.5"],
      ["2.0", "2.0"],
      ["2.5", "2.5"],
      ["3.0", "3.0"],
      ["4.0", "4.0"],
      ["5.0", "5.0"],
      ["6.0", "6.0"],
      ["7.0", "7.0"],
      ["8.0", "8.0"],
    ],
    []
  );

  const groupsForSelect = useMemo(() => groups.map((gr) => [gr.name, gr.id]), [groups]);

  const scaleTemplate = [...Array(nbQuestions).keys()]
    .map((n) => n + 1)
    .map((qNb: number) => (
      <div key={`question-${qNb}-container`} className={cx("questionInput")}>
        <p className={cx("questionText")}>Question {qNb} :</p>
        <div className={cx("radioButtonsContainer")}>
          {[...Array(20).keys()]
            .map((i) => (i + 1) * Number(newEval.gradePrecision))
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

  const groupInputTemplate = [...Array(nbCurrentGroups).keys()].map((i) => (
    <InputField
      key={i}
      type="select"
      className={cx("groupInput")}
      label="Groupe"
      prependIcon="group"
      value={currentGroups[i]}
      setValue={(newValue) => {
        setCurrentGroups((prev) => {
          const copy = [...prev];
          copy[i] = newValue;
          return copy;
        });
      }}
      selectItems={groupsForSelect}
      isRequired
    />
  ));

  return (
    <Container className={cx("evaluations")}>
      <h1 className="pageTitle text-center">Mes Évaluations</h1>

      <div className={cx("newEvalContainer")}>
        <Button className="blue darken-3 text-center" onClick={handleAddEvalModalOpen}>
          Nouvelle Évaluation
        </Button>
      </div>

      <DataTable
        headers={tableHeaders}
        items={evaluations}
        sortBy="creationDate"
        sortOrder={SortOrder.DESC}
      />

      <Modal showModal={bindToGrModalOpen}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={handleBindToGrSubmit}>
            <CardHeader title={<h2>Gérer les groupes évalués</h2>} centerTitle />

            <CardContent>
              <p>Évaluation en question : {currentEvalToBind.name}</p>
              {groupInputTemplate}

              <div className={cx("addIconContainer")}>
                <Button
                  type="icon"
                  iconName="remove"
                  className="yellow darken-1 mr-4"
                  onClick={handleRemoveCurrentGroup}
                  size="small"
                />
                <Button
                  type="icon"
                  iconName="add"
                  className="red darken-1"
                  onClick={handleAddCurrentGroup}
                />
              </div>
            </CardContent>

            <CardActions>
              <Spacer />
              <Button className="red--text mr-4" type="outlined" onClick={handleBindToGrModalClose}>
                Annuler
              </Button>
              <Button
                className="blue darken-3"
                isDisabled={!isAuthenticated || currentGroups.includes("")}
                formSubmit
              >
                Valider
              </Button>
            </CardActions>
          </Form>
        </Card>
      </Modal>

      <Modal showModal={addEvalModalOpen}>
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
                  label="Précision de la notation"
                  prependIcon="precision_manufacturing"
                  selectItems={precisionsForSelect}
                  isRequired
                  {...register("gradePrecision")}
                />
                <InputField
                  type="select"
                  label="Coefficient de la note ramenée sur 20"
                  prependIcon="weight"
                  selectItems={coefficientForSelect}
                  isRequired
                  {...register("coefficient")}
                />
                <p>Les notes des copies seront ramenées sur 20 points.</p>
              </fieldset>

              <fieldset className={cx("scale")}>
                <legend>Barème</legend>
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
                <p>
                  Nombre de questions : {nbQuestions} | Total des points : {totalPoints}
                </p>
              </fieldset>
            </CardContent>

            <CardActions>
              <Spacer />
              <Button className="red--text mr-4" type="outlined" onClick={handleAddEvalModalClose}>
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

      {confirmModalTemplate}
    </Container>
  );
}
