import { useRouter } from "next/router";
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { collection, query, where, onSnapshot, CollectionReference } from "firebase/firestore";
import { db } from "../../../firebase-config";
import { Container, DataTable, SortOrder, Button, BreadCrumbs } from "../../../components";
import { AuthContext } from "../../../contexts/AuthContext";
import { BreakpointsContext } from "../../../contexts/BreakpointsContext";
import groupDashboardStyles from "../../../pageStyles/GroupDashboard.module.scss";
import cn from "classnames/bind";
import { useStudentsTable } from "../../../hooks/useFetchGroup";
import { useGetSubject } from "../../../hooks/useGetSubject";

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

const cx = cn.bind(groupDashboardStyles);

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
  const { groupNotFound, group, studentsTableTemplate } = useStudentsTable();

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
              ? `${roundNum(group.evalStatistics[rawEval.id].average, 2)} / ${
                  rawEval.totalPoints
                } - ${roundNum(group.evalStatistics[rawEval.id].averageOutOf20, 2)} / 20`
              : "Aucune note !",
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
              key={`group-${groupId}-eval-${rawEval.id}-details-btn`}
              href={`/groups/${groupId}/${rawEval.id}`}
              isFlat
              isLink
            >
              {cbp === "sm" ? undefined : "Détails"}
            </Button>,
          ],
        },
      })),
    [rawEvaluations, cbp, groupId, group]
  );

  const evaluationsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Date de création", value: "creationDate" },
      { text: "Titre", value: "title" },
      { text: "Coefficient", value: "coefficient", alignContent: "center" },
      { text: "Moyenne du groupe", value: "groupAverage", alignContent: "center" },
      { text: "Copies corrigées", value: "nbCorrectedCopies", alignContent: "center" },
      { text: "Actions", value: "actions", isSortable: false, alignContent: "center" },
    ],
    []
  );

  const breadCrumbItems = useMemo<[string, string][]>(
    () =>
      group
        ? [
            ["Mes groupes", "/groups"],
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
      {groupNotFound && (
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
