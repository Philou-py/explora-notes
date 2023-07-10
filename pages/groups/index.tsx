import Head from "next/head";
import { useCallback, useState, useContext, useMemo } from "react";
import groupStyles from "../../pageStyles/Groups.module.scss";
import cn, { Binding } from "classnames/bind";
import {
  Container,
  Button,
  InputField,
  DataTable,
  SortOrder,
  TableHeader,
  Modal,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Spacer,
  Form,
  useForm,
} from "../../components";
import { db } from "../../firebase-config";
import { doc, collection, addDoc, updateDoc, deleteField } from "firebase/firestore";
import { AuthContext } from "../../contexts/AuthContext";
import { SnackContext } from "../../contexts/SnackContext";
import { BreakpointsContext } from "../../contexts/BreakpointsContext";
import { TeacherContext, Group } from "../../contexts/TeacherContext";
import { useConfirmation } from "../../hooks/useConfirmation";
import { useGetSubject } from "../../hooks/useGetSubject";

const cx = cn.bind(groupStyles);

// TODO: après le bouton plus, mettre le pointeur sur l'endroit d'écriture

export default function Groups() {
  const { isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { teacherId, groupMap, evaluationMap } = useContext(TeacherContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();
  const { subjects } = useGetSubject();

  const [modalOpen, setModalOpen] = useState(false);
  const {
    data: newGroup,
    setData,
    isValid,
    register,
  } = useForm({ name: "", level: "", subject: "" });
  const [students, setStudents] = useState<[string, string, string][]>([["", "", ""]]);
  const [nbStudents, setNbStudents] = useState(1);
  const [nbDeletedStudents, setNbDeletedStudents] = useState(0);
  const actualNbStudents = useMemo(
    () => nbStudents - nbDeletedStudents,
    [nbStudents, nbDeletedStudents]
  );
  const [studentsFilled, setStudentsFilled] = useState([false]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolYear] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    let schoolYear = "";
    if (month > 6) {
      schoolYear = `${year}-${year + 1}`;
    } else {
      schoolYear = `${year - 1}-${year}`;
    }
    return schoolYear;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState("");
  const [currentDeletedStudents, setCurrentDeletedStudents] = useState<string[]>([]);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const resetForm = useCallback(() => {
    setData({ name: "", level: "", subject: "" });
    setStudents([["", "", ""]]);
    setNbStudents(1);
    setStudentsFilled([false]);
    setNbDeletedStudents(0);
    setIsEditing(false);
    setCurrentGroupId("");
    setCurrentDeletedStudents([]);
  }, [setData]);

  const handleModalOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleAddStudent = useCallback(() => {
    setStudents((prev) => [...prev, ["", "", ""]]);
    setStudentsFilled((prev) => [...prev, false]);
    setNbStudents((prev) => prev + 1);
  }, []);

  const handleRemoveStudent = useCallback(
    (id: number) => {
      if (actualNbStudents > 1) {
        const remove = () => {
          setCurrentDeletedStudents((prev) => {
            const c = [...prev];
            c.push(students[id][2]);
            return c;
          });
          setStudents((prev) => {
            const copy = [...prev];
            copy[id] = null;
            return copy;
          });
          setStudentsFilled((prev) => {
            const copy = [...prev];
            copy[id] = null;
            return copy;
          });
          setNbDeletedStudents((prev) => prev + 1);
        };

        if (isEditing) {
          let hasCopies = false;
          if (students[id][2] !== "") {
            hasCopies = Object.values(evaluationMap)
              .filter((e) => e.associatedGroupIds.includes(currentGroupId))
              .some((evaluation) => {
                return Object.values(evaluation.copies).some((g) => {
                  if (g && g[students[id][2]]) {
                    return true;
                  }
                  return false;
                });
              });
          }
          if (hasCopies) {
            setErrorModalOpen(true);
          } else {
            promptConfirmation("Confirmez-vous la suppression de cet élève de ce groupe ?", remove);
          }
        } else remove();
      }
    },
    [actualNbStudents, students, promptConfirmation, isEditing, evaluationMap, currentGroupId]
  );

  const handleEditGroup = useCallback(
    (group: Group) => {
      setData({ name: group.name, level: group.level, subject: group.subject });
      setNbStudents(group.nbStudents);
      setStudentsFilled(group.studentIds.map(() => true));
      setStudents(Object.values(group.studentMap).map((st) => [st.lastName, st.firstName, st.id]));
      setCurrentGroupId(group.id);
      setCurrentDeletedStudents([]);
      setIsEditing(true);
      handleModalOpen();
    },
    [handleModalOpen, setData]
  );

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    const groupToSend = {
      ...newGroup,
      nbStudents: actualNbStudents,
      schoolYear,
      teacher: teacherId,
      studentIds: [],
      isDeleted: false,
      ...(!isEditing && {
        evalStatistics: {},
        studentMap: {},
      }),
    };

    let studentsToDelete = [...new Set(currentDeletedStudents)];
    let evalsToUpdate = {};

    students
      .filter((name) => name !== null)
      .forEach(async ([lName, fName, oldId]) => {
        const stId = `${lName}-${fName}`;
        groupToSend.studentIds.push(stId);
        if (!isEditing) {
          groupToSend.studentMap[stId] = {
            id: stId,
            firstName: fName,
            lastName: lName,
          };
        } else {
          if (!oldId && studentsToDelete.includes(stId)) {
            studentsToDelete = studentsToDelete.filter((st) => st !== stId);
          } else {
            groupToSend[`studentMap.${stId}.id`] = stId;
            groupToSend[`studentMap.${stId}.firstName`] = fName;
            groupToSend[`studentMap.${stId}.lastName`] = lName;
          }
          if (oldId && oldId !== stId) {
            const oMS = groupMap[currentGroupId].studentMap[oldId];
            if (oMS.subjectAverageOutOf20)
              groupToSend[`studentMap.${stId}.subjectAverageOutOf20`] = oMS.subjectAverageOutOf20;
            if (oMS.subjectPointsSum)
              groupToSend[`studentMap.${stId}.subjectPointsSum`] = oMS.subjectPointsSum;
            if (oMS.subjectWeightTotal)
              groupToSend[`studentMap.${stId}.subjectWeightTotal`] = oMS.subjectWeightTotal;
            groupToSend[`studentMap.${oldId}`] = deleteField();

            const groupEvals = Object.values(evaluationMap).filter((e) =>
              e.associatedGroupIds.includes(groupMap[currentGroupId].id)
            );
            const studentCopies = [];
            groupEvals.forEach((e) => {
              if (e.copies[currentGroupId] && e.copies[currentGroupId][oldId]) {
                studentCopies.push(e.copies[currentGroupId][oldId]);
              }
            });
            studentCopies.forEach((c) => {
              if (!evalsToUpdate[c.evaluationId]) {
                evalsToUpdate[c.evaluationId] = {
                  [`copies.${currentGroupId}.${stId}`]: { ...c, studentId: stId },
                  [`copies.${currentGroupId}.${oldId}`]: deleteField(),
                };
              } else {
                evalsToUpdate[c.evaluationId][`copies.${currentGroupId}.${stId}`] = {
                  ...c,
                  studentId: stId,
                };
                evalsToUpdate[c.evaluationId][`copies.${currentGroupId}.${oldId}`] = deleteField();
              }
            });
          }
        }
      });

    if (!isEditing) {
      await addDoc(collection(db, "groups"), groupToSend);
    } else {
      studentsToDelete.forEach((sId) => {
        groupToSend[`studentMap.${sId}`] = deleteField();
      });
      await updateDoc(doc(db, "groups", currentGroupId), groupToSend);
      Object.keys(evalsToUpdate).forEach((eId) => {
        updateDoc(doc(db, "evaluations", eId), evalsToUpdate[eId]);
        console.log("Updated evaluation with id", eId);
      });
    }

    haveASnack("success", <h6>Le groupe a bien été enregistré !</h6>);
    handleModalClose();
    setIsLoading(false);
  }, [
    newGroup,
    actualNbStudents,
    schoolYear,
    teacherId,
    students,
    haveASnack,
    handleModalClose,
    currentGroupId,
    currentDeletedStudents,
    isEditing,
    groupMap,
    evaluationMap,
  ]);

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      promptConfirmation(
        "Voulez-vous supprimer ce groupe, ses élèves associés et toutes leurs copies ?",
        async () => {
          await updateDoc(doc(db, "groups", groupId), { isDeleted: true });
          haveASnack("success", <h6>Le groupe a bien été supprimé !</h6>);
        }
      );
    },
    [haveASnack, promptConfirmation]
  );

  const tableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Nom du groupe", value: "name" },
      { text: "Matière", value: "subject" },
      { text: "Niveau", value: "level" },
      { text: "Nb d’élèves", value: "nbStudents", alignContent: "center" },
      { text: "Année scolaire", value: "schoolYear", alignContent: "center" },
      { text: "Actions", value: "actions", alignContent: "center", isSortable: false },
    ],
    []
  );

  const levelsForSelect = useMemo(
    () => [
      ["Sixième", "Sixième"],
      ["Cinquième", "Cinquième"],
      ["Quatrième", "Quatrième"],
      ["Troisième", "Troisième"],
      ["Seconde", "Seconde"],
      ["Première", "Première"],
      ["Terminale", "Terminale"],
      ["BCPST 1", "BCPST 1"],
      ["BCPST 2", "BCPST 2"],
      ["MPSI", "MPSI"],
      ["MP", "MP"],
      ["PSI", "PSI"],
      ["PCSI", "PCSI"],
      ["PC", "PC"],
    ],
    []
  );

  const groups = useMemo(
    () =>
      Object.values(groupMap).map((rawGroup) => ({
        key: { rawContent: rawGroup.id },
        name: { rawContent: rawGroup.name },
        subject: { rawContent: rawGroup.subject, content: rawGroup.actualSubject },
        level: { rawContent: rawGroup.level },
        nbStudents: { rawContent: rawGroup.nbStudents, alignContent: "center" },
        schoolYear: { rawContent: rawGroup.schoolYear, alignContent: "center" },
        actions: {
          rawContent: "",
          content: [
            <Button
              type={cbp === "sm" ? "icon" : "text"}
              size="small"
              iconName={cbp === "sm" ? "visibility" : undefined}
              prependIcon={cbp === "sm" ? undefined : "visibility"}
              className="purple--text"
              key={`group-${rawGroup.id}-details-btn`}
              href={`/groups/${rawGroup.id}`}
              isFlat
              isLink
            >
              {cbp === "sm" ? undefined : "Tableau de bord"}
            </Button>,
            <Button
              type="icon"
              size="small"
              iconName="edit"
              className="orange--text"
              key={`group-${rawGroup.id}-edit`}
              onClick={() => handleEditGroup(rawGroup)}
              isFlat
            />,
            <Button
              type="icon"
              size="small"
              iconName="delete"
              className="red--text ml-1"
              key={`group-${rawGroup.id}-delete`}
              onClick={() => {
                handleDeleteGroup(rawGroup.id);
              }}
              isFlat
            />,
          ],
        },
      })),
    [groupMap, handleDeleteGroup, cbp, handleEditGroup]
  );

  const studentsTemplate = [...Array(nbStudents).keys()].map(
    (i) =>
      students[i] !== null && (
        <div key={`student-${i}`} className={cx("studentInput")}>
          <div className={cx("nameInput")}>
            <InputField
              type="text"
              label="Nom de famille"
              prependIcon="badge"
              value={students[i][0]}
              setValue={(newValue) => {
                setStudents((prev) => {
                  const copy = [...prev];
                  copy[i][0] = newValue;
                  return copy;
                });
                setStudentsFilled((prev) => {
                  const copy = [...prev];
                  copy[i] = students[i][0] !== "" && students[i][1] !== "";
                  return copy;
                });
              }}
              isRequired
            />
            <InputField
              type="text"
              label="Prénom"
              prependIcon="face"
              value={students[i][1]}
              setValue={(newValue) => {
                setStudents((prev) => {
                  const copy = [...prev];
                  copy[i][1] = newValue;
                  return copy;
                });
                setStudentsFilled((prev) => {
                  const copy = [...prev];
                  copy[i] = students[i][0] !== "" && students[i][1] !== "";
                  return copy;
                });
              }}
              isRequired
            />
            <Button
              type="icon"
              iconName="delete"
              isFlat
              className={cn(cx("deleteButton"), "red--text")}
              onClick={() => {
                handleRemoveStudent(i);
              }}
              size="small"
              noKeyboardFocus
            />
          </div>
        </div>
      )
  );

  return (
    <Container className={cx("groups")}>
      <Head>
        <title>Gestion des groupes - ExploraNotes</title>
      </Head>

      {isAuthenticated && (
        <>
          <h1 className="pageTitle text-center">Groupes et tableaux de bord</h1>

          <div className={cx("newGroupContainer")}>
            <Button className="blue darken-3 text-center" onClick={handleModalOpen}>
              Nouveau groupe
            </Button>
          </div>

          <DataTable
            headers={tableHeaders}
            items={groups}
            sortBy="schoolYear"
            sortOrder={SortOrder.DESC}
          />
        </>
      )}

      {!isAuthenticated && (
        <h1 className={cx("notAuthenticated")}>
          Connectez-vous pour accéder à vos groupes et leur tableau de bord !
        </h1>
      )}

      <Modal showModal={modalOpen}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={handleSubmit}>
            <CardHeader
              title={<h2>{isEditing ? "Modifier" : "Ajouter"} un groupe</h2>}
              centerTitle
            />
            <CardContent>
              <fieldset className={cx("generalInfo")}>
                <legend>Informations générales</legend>
                <InputField
                  type="text"
                  label="Nom du groupe"
                  prependIcon="face"
                  isRequired
                  maxLength={10}
                  {...register("name")}
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
                  label="Niveau"
                  prependIcon="school"
                  selectItems={levelsForSelect}
                  isRequired
                  {...register("level")}
                />
              </fieldset>

              <fieldset className={cx("studentDetails")}>
                <legend>Élèves</legend>
                <>{studentsTemplate}</>
                <div className={cx("addIconContainer")}>
                  <Button
                    type="icon"
                    iconName="add"
                    className="red darken-1"
                    onClick={handleAddStudent}
                  />
                </div>
                <p>
                  Nombre d&rsquo;élèves : {actualNbStudents} | Année scolaire : {schoolYear}
                </p>
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
                  !isAuthenticated || !isValid || studentsFilled.includes(false) || isLoading
                }
                formSubmit
              >
                {isLoading ? "Chargement..." : "Valider"}
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
              <h4>
                Attention ! L&rsquo;élève que vous tentez de retirer de ce groupe possède des copies
                corrigées ! Pour le supprimer définitivement, veuillez d&rsquo;abord supprimer
                chaque copie individuellement.
              </h4>
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
