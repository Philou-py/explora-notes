import { useRouter } from "next/router";
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  CollectionReference,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase-config";
import { Container, DataTable, SortOrder, Button, BreadCrumbs } from "../../../components";
import { AuthContext } from "../../../contexts/AuthContext";
import { BreakpointsContext } from "../../../contexts/BreakpointsContext";
import groupDashboardStyles from "../../../pageStyles/GroupDashboard.module.scss";
import cn from "classnames/bind";
import { useStudentsTable } from "../../../hooks/useFetchGroup";
import { useGetSubject } from "../../../hooks/useGetSubject";
import { utils, writeFile } from "xlsx";

interface TableHeader {
  text: string;
  value: string;
  isSortable?: boolean;
  align?: "start" | "center" | "end";
  alignContent?: "start" | "center" | "end";
  unitSuffix?: string;
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

const cx = cn.bind(groupDashboardStyles);

const exportOneToXLSX = async (
  groupId: string,
  evalId: string,
  evalTitle: string,
  groupName: string,
  students: Student[]
) => {
  const copiesSnapshot = await getDocs(
    query(
      collection(db, "copies") as CollectionReference<Copy>,
      where("evaluationId", "==", evalId),
      where("groupId", "==", groupId)
    )
  );
  const copies = [];
  copiesSnapshot.forEach((copyRef) => {
    const copyData = copyRef.data();
    const pointsPerQuestion = {};
    copyData.pointsObtained.forEach((point, index) => {
      pointsPerQuestion[`Question ${index + 1}`] = point;
    });
    const student = students.find((st) => st.id === copyData.studentId);
    copies.push({
      "Nom de famille": student.lastName,
      Prénom: student.firstName,
      [`Note (sur ${copyData.totalPoints})`]: copyData.mark,
      "Note sur 20": copyData.markOutOf20,
      ...pointsPerQuestion,
    });
  });
  const worksheet = utils.json_to_sheet(copies);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Évaluation");
  writeFile(workbook, `${evalTitle} - ${groupName}.xlsx`);
};

const exportAllToXLSX = async (
  groupId: string,
  groupName: string,
  evaluations: Evaluation[],
  students: Student[]
) => {
  const copiesSnapshot = await getDocs(
    query(collection(db, "copies") as CollectionReference<Copy>, where("groupId", "==", groupId))
  );
  const studentMarks = {};
  const studentMap = {};
  students.forEach((st) => {
    studentMap[st.id] = st;
    if (!studentMarks[st.id]) {
      studentMarks[st.id] = {};
    }
  });

  copiesSnapshot.forEach((copyRef) => {
    const copyData = copyRef.data();
    studentMarks[copyData.studentId][copyData.evaluationId] = copyData.markOutOf20;
  });

  console.log(studentMarks);

  const exportData = [];
  Object.keys(studentMarks).forEach((studentId) => {
    const marksOutOf20 = studentMarks[studentId];
    const { lastName, firstName } = studentMap[studentId];
    const evalMap = {};
    evaluations.forEach((e) => {
      evalMap[e.title] = marksOutOf20[e.id];
    });
    exportData.push({
      "Nom de famille": lastName,
      Prénom: firstName,
      ...evalMap,
    });
  });

  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Évaluation");
  writeFile(workbook, `Évaluations du groupe ${groupName}.xlsx`);
};

const roundNum = (value: number, nbDecimals: number) => {
  if (value) {
    return Math.round((value + Number.EPSILON) * 10 ** nbDecimals) / 10 ** nbDecimals;
  } else {
    return "";
  }
};

export default function GroupDashboard() {
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const { groupId } = router.query as { groupId: string };
  const { getSubject } = useGetSubject();
  const [rawEvaluations, setRawEvaluations] = useState<Evaluation[]>([]);
  const { groupNotFound, group, studentsTableTemplate, students } = useStudentsTable();

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
      const evaluationsUnsub = getEvaluations();

      return () => {
        evaluationsUnsub();
      };
    }
  }, [isAuthenticated, getEvaluations]);

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
        coefficient: { rawContent: rawEval.coefficient },
        groupAverage: {
          rawContent:
            group && group.evalStatistics[rawEval.id]
              ? group.evalStatistics[rawEval.id].average
              : "",
          content:
            group && group.evalStatistics[rawEval.id] && group.evalStatistics[rawEval.id].average
              ? `${roundNum(group.evalStatistics[rawEval.id].averageOutOf20, 2)} / 20`
              : "Aucune note !",
        },
        minMark: {
          rawContent:
            group && group.evalStatistics[rawEval.id] && group.evalStatistics[rawEval.id].minMark
              ? group.evalStatistics[rawEval.id].minMark
              : "",
          content:
            group && group.evalStatistics[rawEval.id] && group.evalStatistics[rawEval.id].minMark
              ? `${roundNum(group.evalStatistics[rawEval.id].minMarkOutOf20, 2)} / 20`
              : "",
        },
        maxMark: {
          rawContent:
            group && group.evalStatistics[rawEval.id] && group.evalStatistics[rawEval.id].maxMark
              ? group.evalStatistics[rawEval.id].maxMark
              : "",
          content:
            group && group.evalStatistics[rawEval.id] && group.evalStatistics[rawEval.id].maxMark
              ? `${roundNum(group.evalStatistics[rawEval.id].maxMarkOutOf20, 2)} / 20`
              : "",
        },
        nbCorrectedCopies: {
          rawContent:
            group && group.evalStatistics[rawEval.id] ? group.evalStatistics[rawEval.id].copyNb : 0,
          content: group
            ? group.evalStatistics[rawEval.id] && group.evalStatistics[rawEval.id].copyNb
              ? `${group.evalStatistics[rawEval.id].copyNb} / ${group.nbStudents}`
              : `0 / ${group.nbStudents}`
            : "",
        },
        actions: {
          rawContent: "",
          content: [
            <Button
              type={cbp === "sm" ? "icon" : "text"}
              size="small"
              iconName={cbp === "sm" ? "visibility" : undefined}
              prependIcon={cbp === "sm" ? undefined : "visibility"}
              className="purple--text"
              key={`group-${groupId}-eval-${rawEval.id}-details`}
              href={`/groups/${groupId}/${rawEval.id}`}
              isFlat
              isLink
            >
              {cbp === "sm" ? undefined : "Détails"}
            </Button>,
            <Button
              type="icon"
              size="small"
              iconName="file_download"
              className="green--text"
              key={`group-${groupId}-eval-${rawEval.id}-export`}
              onClick={() => {
                exportOneToXLSX(
                  groupId,
                  rawEval.id,
                  rawEval.title,
                  `${group.name} - ${getSubject(group.subject)} - ${group.schoolYear}`,
                  students
                );
              }}
              isFlat
            />,
          ],
        },
      })),
    [rawEvaluations, cbp, groupId, group, students, getSubject]
  );

  const evaluationsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Date de création", value: "creationDate" },
      { text: "Titre", value: "title" },
      { text: "Coefficient", value: "coefficient", alignContent: "center" },
      { text: "Moyenne du groupe", value: "groupAverage", alignContent: "center" },
      { text: "Note min", value: "minMark", alignContent: "center" },
      { text: "Note max", value: "maxMark", alignContent: "center" },
      { text: "Copies corrigées", value: "nbCorrectedCopies", alignContent: "center" },
      { text: "Actions", value: "actions", isSortable: false, alignContent: "center" },
    ],
    []
  );

  const breadCrumbItems = useMemo<[string, string][]>(
    () =>
      group
        ? [
            ["Groupes", "/groups"],
            [group.name, `/groups/${group.id}`],
          ]
        : [],
    [group]
  );

  return (
    <Container className={cx("groupDashboard")}>
      {!isAuthenticated && (
        <h1 className="pageTitle text-center">
          Connectez-vous pour accéder au tableau de bord de cette classe !
        </h1>
      )}
      {isAuthenticated && groupNotFound && (
        <h3 className={cx("groupNotFound")}>
          Oups ! Ce groupe n&rsquo;existe pas, ou bien vous n&rsquo;avez pas la permission de
          consulter son tableau de bord !
        </h3>
      )}
      {isAuthenticated && !groupNotFound && (
        <>
          <BreadCrumbs items={breadCrumbItems} namespace="GroupDasboard" />
          <h1 className="pageTitle text-center">
            {(group &&
              `${group.name} - ${getSubject(group.subject)} - ${
                group.schoolYear
              } - Tableau de bord`) ||
              "Détails du groupe - Chargement..."}
          </h1>

          <h2>Évaluations associées</h2>
          <Button
            className="blue darken-3 text-center"
            onClick={() => {
              exportAllToXLSX(
                groupId,
                `${group.name} - ${getSubject(group.subject)} - ${group.schoolYear}`,
                rawEvaluations,
                students
              );
            }}
          >
            Exporter tout
          </Button>
          <DataTable
            headers={evaluationsTableHeaders}
            items={evaluations}
            sortBy="creationDate"
            sortOrder={SortOrder.DESC}
          />

          <h2>Élèves du groupe</h2>
          {studentsTableTemplate}
        </>
      )}
    </Container>
  );
}
