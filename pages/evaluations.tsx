import Head from "next/head";
import evalStyles from "../pageStyles/Evaluations.module.scss";
import cn from "classnames/bind";
import { useState, useContext, useCallback, useMemo } from "react";
import { db } from "../firebase-config";
import { doc, collection, addDoc, deleteDoc, updateDoc, deleteField } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import { SnackContext } from "../contexts/SnackContext";
import { BreakpointsContext } from "../contexts/BreakpointsContext";
import { TeacherContext, Evaluation } from "../contexts/TeacherContext";
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
  TableHeader,
} from "../components";
import { useConfirmation } from "../hooks/useConfirmation";

const cx = cn.bind(evalStyles);

export default function Evaluations() {
  const { isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { teacherId, evaluationMap, groupMap } = useContext(TeacherContext);
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();

  const [errorModalOpen, setErrorModalOpen] = useState(false);
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
  const [exercises, setExercises] = useState([0]);
  const [touchedQuestions, setTouchedQuestions] = useState<boolean[]>([]);
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
    setExercises([0]);
    setCurrentEvalToEdit(undefined);
    setTouchedQuestions([]);
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
      setExercises(rawEval.exercises || [0]);
      setCurrentEvalToEdit(rawEval);
      const hasCopies = Object.values(rawEval.copies).some((g) => Object.values(g).length !== 0);
      if (!hasCopies) {
        console.log("Performing a detailed edit!");
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
      if (exercises[exercises.length - 1] === nbQuestions - 1) {
        setExercises((prev) => prev.slice(0, -1));
      }
    }
  }, [nbQuestions, exercises]);

  const totalPoints = useMemo(() => scale.reduce((total, newVal) => total + newVal, 0), [scale]);

  const exerciseScale = useMemo(() => {
    const pointsByEx = exercises.map((_) => 0);
    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      let startQIndex = exercises[exIndex];
      let endQIndex = exIndex === exercises.length - 1 ? nbQuestions : exercises[exIndex + 1];
      for (let qIndex = startQIndex; qIndex < endQIndex; qIndex++) {
        pointsByEx[exIndex] += scale[qIndex];
      }
    }
    return pointsByEx;
  }, [exercises, nbQuestions, scale]);

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
      const hasCopies = Object.values(evaluationMap[evalId].copies).some(
        (g) => Object.values(g).length !== 0
      );
      if (hasCopies) {
        setErrorModalOpen(true);
      } else {
        promptConfirmation(
          "Voulez-vous supprimer cette évaluation de manière définitive ?",
          async () => {
            await deleteDoc(doc(db, "evaluations", evalId));
            haveASnack("success", <h6>L&rsquo;évaluation a bien été supprimée !</h6>);
          }
        );
      }
    },
    [haveASnack, promptConfirmation, evaluationMap]
  );

  const handleAddExercise = useCallback(() => {
    handleAddQuestion();
    setExercises((prev) => [...prev, nbQuestions]);
  }, [nbQuestions, handleAddQuestion]);

  const handleExerciseUp = useCallback((exNb: number) => {
    setExercises((prev) => {
      const newExs = [...prev];
      if (newExs[exNb] - 1 === newExs[exNb - 1]) {
        return newExs;
      }
      newExs[exNb] -= 1;
      return newExs;
    });
  }, []);

  const handleExerciseDown = useCallback(
    (exNb: number) => {
      setExercises((prev) => {
        const newExs = [...prev];
        if (newExs[exNb] + 1 === nbQuestions) {
          return newExs;
        }
        if (exNb !== newExs.length && newExs[exNb] + 1 === newExs[exNb + 1]) {
          return newExs;
        }
        newExs[exNb] += 1;
        return newExs;
      });
    },
    [nbQuestions]
  );

  const hasScaleConflicts = useCallback(
    (evalId: string) => {
      const evaluation = evaluationMap[evalId];
      return evaluation.associatedGroupIds.some((gId) =>
        groupMap[gId].evalStatistics[evalId]
          ? groupMap[gId].evalStatistics[evalId].scaleConflicts
          : false
      );
    },
    [evaluationMap, groupMap]
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
          content: (
            <div className={cx("groupDisplayContainer", cbp)}>
              {rawEval.associatedGroupIds.map((gId) => (
                <Button
                  key={gId}
                  type="outlined"
                  href={`/groups/${gId}/${rawEval.id}`}
                  className={cn("cyan--text", cx("groupBtn"))}
                  isLink
                  isFlat
                >
                  {`${groupMap[gId].name} - ${groupMap[gId].actualSubject.slice(0, 3)} - ${
                    groupMap[gId].shortenedLevel
                  } - ${groupMap[gId].shortenedSchoolYear}`}
                </Button>
              ))}
            </div>
          ),
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
              isDisabled={hasScaleConflicts(rawEval.id)}
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
    [
      handleBindToGrModalOpen,
      handleDeleteEvaluation,
      evaluationMap,
      groupMap,
      handleEditEvaluation,
      cbp,
      hasScaleConflicts,
    ]
  );

  const handleSubmit = useCallback(async () => {
    const evaluationToSend = {
      ...newEval,
      markPrecision: Number(newEval.markPrecision),
      coefficient: Number(newEval.coefficient),
      scale,
      totalPoints,
      nbQuestions,
      exercises,
      exerciseScale,
      creationDate: isEditing ? currentEvalToEdit.creationDate : new Date().toISOString(),
      creator: teacherId,
      associatedGroupIds: isEditing ? currentEvalToEdit.associatedGroupIds : [],
      ...(!isEditing ? { copies: {} } : {}),
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
            const nSAOO20 = newCoef === 0 ? deleteField() : nSPS / nSWT;

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

      if (!detailedEditing && touchedQuestions.length !== 0) {
        // Update of all copies to indicate which questions were modified
        const allGroupCopies = evaluationMap[evalId].copies;
        const modifiedQuestions = touchedQuestions
          .map((v, i) => v && i)
          .filter((e) => e !== undefined);
        const groupsToEdit = {};
        Object.keys(allGroupCopies).forEach((groupId) => {
          Object.values(allGroupCopies[groupId]).forEach((c) => {
            evaluationToSend[`copies.${c.groupId}.${c.studentId}.modifiedQuestions`] =
              modifiedQuestions;
          });

          groupsToEdit[groupId] = {
            [`evalStatistics.${evalId}.scaleConflicts`]: true,
          };
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
    exercises,
    exerciseScale,
    touchedQuestions,
  ]);

  const handleSubmitWithConfirm = useCallback(() => {
    if (isEditing && !detailedEditing && touchedQuestions.length !== 0) {
      promptConfirmation(
        "La modification du barème d'une évaluation implique la révision des questions modifiées dans chacune des copies déjà corrigées de tous les groupes. Souhaitez-vous continuer ?",
        handleSubmit
      );
    } else handleSubmit();
  }, [promptConfirmation, handleSubmit, detailedEditing, touchedQuestions, isEditing]);

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
      ["0", "0"],
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

  const currEx = (qNb: number) =>
    exercises.reduce((prev, curr) => (curr <= qNb ? prev + 1 : prev), -1);

  const scaleTemplate = [...Array(nbQuestions).keys()].map((qNb: number) => (
    <div className={cx("questionBlock")} key={`question-${qNb}-container`}>
      {exercises.includes(qNb) && (
        <div className={cx("exerciseWrapper")}>
          <p className={cx("exerciseText")}>Exercice {exercises.indexOf(qNb) + 1} :</p>
          {(!isEditing || detailedEditing) && qNb !== 0 && (
            <div className={cx("exerciseUpDown")}>
              <Button
                type="icon"
                iconName="keyboard_arrow_down"
                className="purple darken-1 mr-4"
                onClick={() => handleExerciseDown(exercises.indexOf(qNb))}
                size="small"
              />
              <Button
                type="icon"
                iconName="keyboard_arrow_up"
                className="blue darken-1"
                onClick={() => {
                  handleExerciseUp(exercises.indexOf(qNb));
                }}
                size="small"
              />
            </div>
          )}
        </div>
      )}
      <div className={cx("questionInput", { isModified: touchedQuestions[qNb] })}>
        <p className={cx("questionText")}>
          Question {exercises.reduce((prev, curr) => (curr <= qNb ? qNb - curr + 1 : prev), 0)} :
        </p>
        <div className={cx("radioButtonsContainer")}>
          {[...Array(21).keys()]
            .map((i) => i * Number(newEval.markPrecision))
            .map((i) => (
              <div key={`question-${qNb}-precision-${i}`} className={cx("radioButton")}>
                <label>
                  <input
                    type="radio"
                    name={`question-${qNb}`}
                    value={i}
                    checked={i === scale[qNb]}
                    onChange={() => {
                      setScale((prev) => {
                        let copy = [...prev];
                        copy[qNb] = i;
                        return copy;
                      });
                      if (isEditing && !detailedEditing && !touchedQuestions[qNb]) {
                        setTouchedQuestions((prev) => {
                          let copy = [...prev];
                          copy[qNb] = true;
                          return copy;
                        });
                      }
                    }}
                    required
                  />
                  {i}
                </label>
              </div>
            ))}
        </div>
      </div>
      {(qNb === nbQuestions - 1 || exercises.includes(qNb + 1)) && (
        <p className={cx("exerciseSummaryText")}>
          Total de points de l&rsquo;exercice {currEx(qNb) + 1} : {exerciseScale[currEx(qNb)]}
        </p>
      )}
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
      <Head>
        <title>Gestion des évaluations - ExploraNotes</title>
      </Head>

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
              <p className="red--text">
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
          <Form onSubmit={handleSubmitWithConfirm}>
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

              <fieldset className={cx("scale")}>
                <legend>Barème</legend>
                {scaleTemplate}
                {(!isEditing || detailedEditing) && (
                  <>
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
                    <div className={cx("addExerciseContainer")}>
                      <Button
                        type="outlined"
                        prependIcon="add_box"
                        className="green--text"
                        onClick={handleAddExercise}
                      >
                        Exercice
                      </Button>
                    </div>
                  </>
                )}
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
                  !isAuthenticated || !isValid || scale.includes(undefined) || totalPoints === 0
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

      <Modal showModal={errorModalOpen}>
        <Card cssWidth="clamp(50px, 510px, 95%)">
          <CardHeader
            title={
              <h5>
                Attention ! Des copies ont déjà été corrigées pour l&rsquo;évaluation que vous
                tentez de retirer ! Pour la supprimer définitivement, veuillez d&rsquo;abord
                supprimer chaque copie individuellement. Vous pouvez sinon mettre le coefficient à
                zéro.
              </h5>
            }
            centerTitle
          />
          <CardContent />
          <CardActions>
            <Spacer />
            <Button
              className="cyan darken-1"
              onClick={() => {
                setErrorModalOpen(false);
              }}
              prependIcon="thumb_up"
            >
              D&rsquo;accord !
            </Button>
            <Spacer />
          </CardActions>
        </Card>
      </Modal>
    </Container>
  );
}
