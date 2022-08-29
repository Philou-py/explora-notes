import { useCallback, useState, useEffect, useContext, useMemo } from "react";
import groupStyles from "../../pageStyles/Groups.module.scss";
import cn from "classnames/bind";
import {
  Container,
  Button,
  InputField,
  DataTable,
  SortOrder,
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
import {
  doc,
  setDoc,
  query,
  collection,
  onSnapshot,
  CollectionReference,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { AuthContext } from "../../contexts/AuthContext";
import { SnackContext } from "../../contexts/SnackContext";
import { BreakpointsContext } from "../../contexts/BreakpointsContext";
import { useConfirmation } from "../../hooks/useConfirmation";

interface TableHeader {
  text: string;
  value: string;
  isSortable?: boolean;
  align?: "start" | "center" | "end";
  alignContent?: "start" | "center" | "end";
  unitSuffix?: string;
}

interface Group {
  id: string;
  teacher: string;
  schoolYear: string;
  name: string;
  nbStudents: number;
  subject: string;
  studentIdsAndAverages: {
    id: string;
    subjectAverage: number;
    subjectMarkNb: number;
    subjectPointsSum: number;
  }[];
}

const cx = cn.bind(groupStyles);

// TODO: après le bouton plus, mettre le pointeur sur l'endroit d'écriture

export default function Groups() {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();

  const [modalOpen, setModalOpen] = useState(false);
  const [rawGroups, setRawGroups] = useState<Group[]>([]);
  const { data: newGroup, setData, isValid, register } = useForm({ name: "", subject: "" });
  const [students, setStudents] = useState<[string, string][]>([["", ""]]);
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

  const resetForm = useCallback(() => {
    setData({ name: "", subject: "" });
    setStudents([["", ""]]);
    setNbStudents(1);
    setStudentsFilled([false]);
    setNbDeletedStudents(0);
  }, [setData]);

  const handleModalOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleAddStudent = useCallback(() => {
    setStudents((prev) => [...prev, ["", ""]]);
    setStudentsFilled((prev) => [...prev, false]);
    setNbStudents((prev) => prev + 1);
  }, []);

  const handleRemoveStudent = useCallback(
    (id: number) => {
      if (actualNbStudents > 1) {
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
      }
    },
    [actualNbStudents]
  );

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    const groupToSend = {
      ...newGroup,
      nbStudents: actualNbStudents,
      schoolYear,
      teacher: currentUser.id,
      studentIdsAndAverages: [],
    };
    const studentIds = [];
    students
      .filter((name) => name !== null)
      .forEach(async (studentNameParts) => {
        const docId = studentNameParts.join("-");
        studentIds.push({ id: docId, subjectMarkNb: 0, subjectPointsSum: 0 });
        const studentRef = doc(db, "students", docId);
        await setDoc(studentRef, {
          lastName: studentNameParts[0],
          firstName: studentNameParts[1],
        });
      });
    groupToSend.studentIdsAndAverages = studentIds;
    await addDoc(collection(db, "groups"), groupToSend);
    haveASnack("success", <h6>Le groupe &laquo; {newGroup.name} &raquo; a bien été créée !</h6>);
    handleModalClose();
    setIsLoading(false);
  }, [newGroup, actualNbStudents, schoolYear, currentUser, students, haveASnack, handleModalClose]);

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      promptConfirmation(
        "Voulez-vous supprimer ce groupe et dissocier tous les élèves associés ?",
        async () => {
          // TODO: delete group ID in the groupIds property of each student
          await deleteDoc(doc(db, "groups", groupId));
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
      { text: "Nb d’élèves", value: "nbStudents", alignContent: "center" },
      { text: "Année scolaire", value: "schoolYear", alignContent: "center" },
      { text: "Actions", value: "actions", alignContent: "center", isSortable: false },
    ],
    []
  );

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
        collection(db, "groups") as CollectionReference<Group>,
        where("teacher", "==", currentUser.id)
      );

      const queryUnsub = onSnapshot(q, (querySnapshot) => {
        const g = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          g.push({ id: doc.id, ...docData });
        });
        setRawGroups(g);
      });

      return queryUnsub;
    }
  }, [isAuthenticated, currentUser, getSubject]);

  const groups = useMemo(
    () =>
      rawGroups.map((rawGroup) => ({
        key: { rawContent: rawGroup.id },
        name: { rawContent: rawGroup.name },
        subject: { rawContent: rawGroup.subject, content: getSubject(rawGroup.subject) },
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
              {cbp === "sm" ? undefined : "Détails"}
            </Button>,
            <Button
              type="icon"
              size="small"
              iconName="edit"
              className="orange--text"
              key={`group-${rawGroup.id}-edit`}
              onClick={() => {}}
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
    [rawGroups, getSubject, handleDeleteGroup, cbp]
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
      <h1 className="pageTitle text-center">Mes groupes</h1>

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

      <Modal showModal={modalOpen}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={handleSubmit}>
            <CardHeader title={<h2>Ajouter un groupe</h2>} centerTitle />
            <CardContent>
              <fieldset className={cx("generalInfo")}>
                <legend>Informations générales</legend>
                <InputField
                  type="text"
                  label="Nom du groupe"
                  prependIcon="face"
                  isRequired
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
    </Container>
  );
}
