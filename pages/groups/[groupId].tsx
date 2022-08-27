import { useRouter } from "next/router";
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { doc, collection, query, where, onSnapshot, CollectionReference } from "firebase/firestore";
import { db } from "../../firebase-config";
import { Container, DataTable, SortOrder } from "../../components";
import { AuthContext } from "../../contexts/AuthContext";
import { SnackContext } from "../../contexts/SnackContext";
import groupDashboardStyles from "../../pageStyles/GroupDashboard.module.scss";
import cn from "classnames/bind";

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
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  groupIds: string[];
}

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

const cx = cn.bind(groupDashboardStyles);

export default function GroupDashboard() {
  const { currentUser, isAuthenticated, setModalOpen } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const router = useRouter();
  const { groupId } = router.query as { groupId: string };
  const [notFound, setNotFound] = useState(false);

  const [group, setGroup] = useState<Group | undefined>();
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawEvaluations, setRawEvaluations] = useState<Evaluation[]>([]);

  const getGroup = useCallback(() => {
    const groupUnsub = onSnapshot(doc(db, "groups", groupId), (groupSnapshot) => {
      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data();
        if (groupData.teacher === currentUser.id) {
          setGroup({ id: groupSnapshot.id, ...groupData } as Group);
          setNotFound(false);
          return;
        }
      }
      setNotFound(true);
      setGroup(undefined);
    });
    return groupUnsub;
  }, [groupId, currentUser]);

  const getStudents = useCallback(() => {
    const qStudents = query(
      collection(db, "students") as CollectionReference<Student>,
      where("groupIds", "array-contains", groupId)
    );

    const studentsUnsub = onSnapshot(qStudents, (querySnapshot) => {
      const rawStudents: Student[] = [];
      querySnapshot.forEach((studentSnapshot) => {
        const studentData = studentSnapshot.data();
        rawStudents.push({ id: studentSnapshot.id, ...studentData } as Student);
      });
      setRawStudents(rawStudents);
    });

    return studentsUnsub;
  }, [groupId]);

  const getEvaluations = useCallback(() => {
    const qEvaluations = query(
      collection(db, "evaluations") as CollectionReference<Evaluation>,
      where("associatedGroupIds", "array-contains", groupId)
    );

    const evaluationsUnsub = onSnapshot(qEvaluations, (querySnapshot) => {
      const rawEvaluations: Evaluation[] = [];
      querySnapshot.forEach((evaluationSnapshot) => {
        const evaluationData = evaluationSnapshot.data();
        rawEvaluations.push({ id: evaluationSnapshot.id, ...evaluationData } as Evaluation);
      });
      setRawEvaluations(rawEvaluations);
    });

    return evaluationsUnsub;
  }, [groupId]);

  useEffect(() => {
    if (isAuthenticated) {
      const groupUnsub = getGroup();
      const studentUnsub = getStudents();
      const evaluationsUnsub = getEvaluations();

      return () => {
        groupUnsub();
        studentUnsub();
        evaluationsUnsub();
      };
    }
  }, [isAuthenticated, getGroup, setModalOpen, getStudents, getEvaluations]);

  const students = useMemo(
    () =>
      rawStudents.map((rawStudent) => ({
        key: { rawContent: rawStudent.id },
        lastName: { rawContent: rawStudent.lastName },
        firstName: { rawContent: rawStudent.firstName },
      })),
    [rawStudents]
  );

  const studentsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Nom de famille", value: "lastName" },
      { text: "Prénom", value: "firstName" },
    ],
    []
  );

  const evaluations = useMemo(
    () =>
      rawEvaluations.map((rawEval) => ({
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
        actions: { rawContent: "", content: [] },
      })),
    [rawEvaluations]
  );

  const evaluationsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Date de création", value: "creationDate" },
      { text: "Titre", value: "title" },
      { text: "Nb de questions", value: "nbQuestions", alignContent: "center" },
      { text: "Coefficient", value: "coefficient", alignContent: "center" },
      { text: "Actions", value: "actions", isSortable: false, alignContent: "center" },
    ],
    []
  );

  return (
    <Container className={cx("groupDashboard")}>
      {!isAuthenticated && (
        <h1 className="pageTitle text-center">
          Connectez-vous pour accéder au tableau de bord de cette classe !
        </h1>
      )}
      {notFound && (
        <h3 className={cx("groupNotFound")}>
          Oups ! Ce groupe n&rsquo;existe pas, ou bien vous n&rsquo;avez pas la permission de
          consulter son tableau de bord !
        </h3>
      )}
      {isAuthenticated && !notFound && (
        <>
          <h1 className="pageTitle text-center">
            {(group && `${group.name} - Tableau de bord`) || "Détails du groupe - Chargement..."}
          </h1>

          <h2>Élèves du groupe</h2>
          <DataTable headers={studentsTableHeaders} items={students} sortBy="lastName" />

          <h2>Évaluations associées</h2>
          <DataTable
            headers={evaluationsTableHeaders}
            items={evaluations}
            sortBy="creationDate"
            sortOrder={SortOrder.DESC}
          />
        </>
      )}
    </Container>
  );
}
