import evalStyles from "../pageStyles/Evaluations.module.scss";
import cn from "classnames/bind";
import { useState, useContext, useCallback, useMemo } from "react";
import { db } from "../firebase-config";
import { doc, collection, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import { SnackContext } from "../contexts/SnackContext";
import { TeacherContext } from "../contexts/TeacherContext";
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
  copies: {
    [gId: string]: {
      [sId: string]: Copy;
    };
  };
}

const cx = cn.bind(evalStyles);

export default function Evaluations() {
  const { isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { teacherId, evaluationMap, groupMap } = useContext(TeacherContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();

  const [addEvalModalOpen, setAddEvalModalOpen] = useState(false);
  const [bindToGrModalOpen, setBindToGrModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvalToEdit, setCurrentEvalToEdit] = useState<Evaluation>();
  const [detailedEditing, setDetailedEditing] = useState(false);
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
  } = useForm({ title: "", markPrecision: "0.5", coefficient: "1" });

  const resetForm = useCallback(() => {
    setData({ title: "", markPrecision: "0.5", coefficient: "1" });
    setNbQuestions(1);
    setScale([1]);
    setCurrentEvalToEdit(undefined);
    setIsEditing(false);
    setDetailedEditing(false);
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

  const handleEditEvaluation = useCallback(
    (rawEval: Evaluation) => {
      setData({
        title: rawEval.title,
        markPrecision: rawEval.markPrecision.toString(),
        coefficient: rawEval.coefficient.toString(),
      });
      setScale(rawEval.scale);
      setNbQuestions(rawEval.nbQuestions);
      setCurrentEvalToEdit(rawEval);
      if (
        !Object.values(rawEval.copies)
          .map((copiesForG) => Object.keys(copiesForG).length === 0)
          .includes(false)
      ) {
        console.log("Performing a detailed edit!");
        // Allow user to modify scale if no copies exist
        setDetailedEditing(true);
      }
      setIsEditing(true);
      handleAddEvalModalOpen();
    },
    [handleAddEvalModalOpen, setData]
  );

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

  const handleDeleteEvaluation = useCallback(
    (evalId: string) => {
      promptConfirmation(
        "Voulez-vous supprimer cette évaluation de manière définitive ainsi que toutes les copies associées ?",
        async () => {
          await deleteDoc(doc(db, "evaluations", evalId));
          haveASnack("success", <h6>L&rsquo;évaluation a bien été supprimée !</h6>);
        }
      );
    },
    [haveASnack, promptConfirmation]
  );

  const evaluations = useMemo(
    () =>
      Object.values(evaluationMap).map((rawEval) => ({
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
          rawContent: rawEval.associatedGroupIds.map((id) => groupMap[id].name).join(", "),
          content: rawEval.associatedGroupIds.map((gId) => (
            <Button
              key={gId}
              type="outlined"
              href={`/groups/${gId}/${rawEval.id}`}
              className="cyan--text mr-2"
              isLink
              isFlat
            >
              {`${groupMap[gId].name} - ${groupMap[gId].actualSubject.slice(0, 3)} - ${
                groupMap[gId].shortenedLevel
              } - ${groupMap[gId].shortenedSchoolYear}`}
            </Button>
          )),
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
              iconName="edit"
              className="orange--text"
              key={`eval-${rawEval.id}-edit`}
              onClick={() => handleEditEvaluation(rawEval)}
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
    [handleBindToGrModalOpen, handleDeleteEvaluation, evaluationMap, groupMap, handleEditEvaluation]
  );

  const handleSubmit = useCallback(async () => {
    const evaluationToSend = {
      ...newEval,
      markPrecision: Number(newEval.markPrecision),
      coefficient: Number(newEval.coefficient),
      scale,
      totalPoints,
      nbQuestions,
      creationDate: isEditing ? currentEvalToEdit.creationDate : new Date().toISOString(),
      creator: teacherId,
      associatedGroupIds: isEditing ? currentEvalToEdit.associatedGroupIds : [],
      copies: detailedEditing || !isEditing ? {} : currentEvalToEdit.copies,
    };

    if (!isEditing) {
      await addDoc(collection(db, "evaluations"), evaluationToSend);
    } else {
      const evalId = currentEvalToEdit.id;

      // Update the students' averages if the coefficient has changed
      if (!detailedEditing && evaluationToSend.coefficient !== currentEvalToEdit.coefficient) {
        const oldCoef = currentEvalToEdit.coefficient;
        const newCoef = evaluationToSend.coefficient;
        const groupsToEdit = {};
        const allGroupCopies = evaluationMap[evalId].copies;
        Object.values(allGroupCopies).forEach((copyMap) => {
          Object.values(copyMap).forEach((c) => {
            const oSPS = groupMap[c.groupId].studentMap[c.studentId].subjectPointsSum;
            const oSWT = groupMap[c.groupId].studentMap[c.studentId].subjectWeightTotal;

            const nSPS = oSPS - c.markOutOf20 * oldCoef + c.markOutOf20 * newCoef;
            const nSWT = oSWT - oldCoef + newCoef;
            const nSAOO20 = nSPS / nSWT;

            if (groupsToEdit[c.groupId]) {
              groupsToEdit[c.groupId][`studentMap.${c.studentId}.subjectPointsSum`] = nSPS;
              groupsToEdit[c.groupId][`studentMap.${c.studentId}.subjectWeightTotal`] = nSWT;
              groupsToEdit[c.groupId][`studentMap.${c.studentId}.subjectAverageOutOf20`] = nSAOO20;
            } else {
              groupsToEdit[c.groupId] = {
                [`studentMap.${c.studentId}.subjectPointsSum`]: nSPS,
                [`studentMap.${c.studentId}.subjectWeightTotal`]: nSWT,
                [`studentMap.${c.studentId}.subjectAverageOutOf20`]: nSAOO20,
              };
            }
          });
        });

        Object.keys(groupsToEdit).forEach((gId) => {
          updateDoc(doc(db, "groups", gId), groupsToEdit[gId]);
        });
      }
      await updateDoc(doc(db, "evaluations", evalId), evaluationToSend);
    }

    haveASnack(
      "success",
      <h6>L&rsquo;évaluation &laquo; {newEval.title} &raquo; a bien été enregistrée !</h6>
    );
    handleAddEvalModalClose();
  }, [
    newEval,
    scale,
    totalPoints,
    nbQuestions,
    teacherId,
    haveASnack,
    handleAddEvalModalClose,
    isEditing,
    detailedEditing,
    currentEvalToEdit,
    evaluationMap,
    groupMap,
  ]);

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
      ["1.0", "1"],
      ["2.0", "2"],
    ],
    []
  );

  const coefficientForSelect = useMemo(
    () => [
      ["0.5", "0.5"],
      ["1.0", "1"],
      ["1.5", "1.5"],
      ["2.0", "2"],
      ["2.5", "2.5"],
      ["3.0", "3"],
      ["4.0", "4"],
      ["5.0", "5"],
      ["6.0", "6"],
      ["7.0", "7"],
      ["8.0", "8"],
    ],
    []
  );

  const groupsForSelect = useMemo(
    () =>
      Object.values(groupMap).map((gr) => [
        `${gr.name} - ${gr.actualSubject} - ${gr.shortenedLevel} - ${gr.shortenedSchoolYear}`,
        gr.id,
      ]),
    [groupMap]
  );

  const scaleTemplate = [...Array(nbQuestions).keys()]
    .map((n) => n + 1)
    .map((qNb: number) => (
      <div key={`question-${qNb}-container`} className={cx("questionInput")}>
        <p className={cx("questionText")}>Question {qNb} :</p>
        <div className={cx("radioButtonsContainer")}>
          {[...Array(20).keys()]
            .map((i) => (i + 1) * Number(newEval.markPrecision))
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
      {isAuthenticated && (
        <>
          <h1 className="pageTitle text-center">Évaluations</h1>

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
        </>
      )}
      {!isAuthenticated && (
        <h1 className={cx("notAuthenticated")}>Connectez-vous pour accéder à vos évaluations !</h1>
      )}
      <Modal showModal={bindToGrModalOpen}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={handleBindToGrSubmit}>
            <CardHeader title={<h2>Groupes évalués</h2>} centerTitle />

            <CardContent>
              <p>Évaluation en question : {currentEvalToBind.name}</p>
              <p>
                Attention ! Si vous souhaitez dissocier un groupe, veillez à supprimer au préalable
                toutes les copies des élèves du groupe !
              </p>
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
            <CardHeader
              title={<h2>{isEditing ? "Modifier" : "Créer"} une évaluation</h2>}
              centerTitle
            />
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
                  label="Intervalle de notation"
                  prependIcon="precision_manufacturing"
                  selectItems={precisionsForSelect}
                  isRequired
                  isDisabled={isEditing && !detailedEditing}
                  {...register("markPrecision")}
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

              {(!isEditing || detailedEditing) && (
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
              )}
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
