import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useCallback, useMemo } from "react";
import {
  Container,
  DataTable,
  SortOrder,
  TableHeader,
  Button,
  BreadCrumbs,
} from "../../../components";
import { AuthContext } from "../../../contexts/AuthContext";
import { BreakpointsContext } from "../../../contexts/BreakpointsContext";
import { SnackContext } from "../../../contexts/SnackContext";
import { TeacherContext } from "../../../contexts/TeacherContext";
import groupDashboardStyles from "../../../pageStyles/GroupDashboard.module.scss";
import cn from "classnames/bind";
import StudentsTable from "../../../layouts/StudentsTable";
import { utils, writeFile } from "xlsx";
import { roundNum } from "../../../helpers/roundNum";

const cx = cn.bind(groupDashboardStyles);

export default function GroupDashboard() {
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { evaluationMap, groupMap } = useContext(TeacherContext);
  const router = useRouter();
  const { groupId } = router.query as { groupId: string };
  const group = useMemo(() => groupMap[groupId], [groupMap, groupId]);
  const groupNotFound = useMemo(() => group === undefined, [group]);

  const rawEvaluations = useMemo(
    () => Object.values(evaluationMap).filter((e) => e.associatedGroupIds.includes(groupId)),
    [evaluationMap, groupId]
  );

  const exportOneToXLSX = useCallback(
    async (evalId: string) => {
      const group = groupMap[groupId];
      const evaluation = evaluationMap[evalId];
      if (Object.values(evaluation.copies[groupId]).length === 0) {
        haveASnack(
          "error",
          <h6>
            Impossible d&rsquo;exporter, car aucune copie n&rsquo;a été créée pour cette évaluation
            !
          </h6>
        );
        return;
      }
      const copies = Object.values(evaluation.copies[groupId]).map((copy) => {
        const pointsPerQuestion = {};
        copy.pointsObtained.forEach((point, index) => {
          pointsPerQuestion[`Question ${index + 1} (${evaluation.scale[index]} pts)`] = point;
        });
        const pointsByEx = {};
        copy.pointsByEx.forEach((pts, index) => {
          pointsByEx[`Exercice ${index + 1} (${evaluation.exerciseScale[index]} pts)`] = pts;
        });
        const student = group.studentMap[copy.studentId];

        return {
          "Nom de famille": student.lastName,
          Prénom: student.firstName,
          [`Note (sur ${evaluation.totalPoints})`]: roundNum(copy.mark, 2),
          "Note sur 20": roundNum(copy.markOutOf20, 2),
          ...pointsByEx,
          ...pointsPerQuestion,
          "Points bonus": copy.bonusPoints,
          "Points malus": copy.penaltyPoints,
        };
      });

      const worksheet = utils.json_to_sheet(copies);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Évaluation");
      writeFile(
        workbook,
        `${evaluation.title} - ${group.name} - ${group.actualSubject} - ${group.level} - ${group.schoolYear}.xlsx`
      );
    },
    [evaluationMap, groupId, groupMap, haveASnack]
  );

  const exportAllToXLSX = useCallback(async () => {
    const group = groupMap[groupId];
    if (Object.values(rawEvaluations).length === 0) {
      haveASnack(
        "error",
        <h6>
          Impossible d&rsquo;exporter, car aucune évaluation n&rsquo;a été créée pour ce groupe !
        </h6>
      );
      return;
    }

    const exportData = Object.values(group.studentMap).map((student) => {
      const evalMarks = {};
      rawEvaluations.forEach((rawEval) => {
        evalMarks[`${rawEval.title} (coef ${rawEval.coefficient})`] =
          rawEval.copies[groupId][student.id] &&
          roundNum(rawEval.copies[groupId][student.id].markOutOf20, 2);
      });
      return {
        "Nom de famille": student.lastName,
        Prénom: student.firstName,
        ...evalMarks,
      };
    });

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Évaluation");
    writeFile(
      workbook,
      `Évaluations du groupe ${group.name} ${group.actualSubject} ${group.level} ${group.schoolYear}.xlsx`
    );
  }, [groupId, groupMap, rawEvaluations, haveASnack]);

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
            group &&
            group.evalStatistics[rawEval.id] &&
            group.evalStatistics[rawEval.id].average !== undefined
              ? group.evalStatistics[rawEval.id].average
              : "",
          content:
            group &&
            group.evalStatistics[rawEval.id] &&
            group.evalStatistics[rawEval.id].average !== undefined
              ? roundNum(group.evalStatistics[rawEval.id].averageOutOf20, 2)
              : "Aucune note !",
        },
        minMark: {
          rawContent:
            group &&
            group.evalStatistics[rawEval.id] &&
            group.evalStatistics[rawEval.id].minMark !== undefined
              ? group.evalStatistics[rawEval.id].minMark
              : "",
          content:
            group &&
            group.evalStatistics[rawEval.id] &&
            group.evalStatistics[rawEval.id].minMark !== undefined
              ? roundNum(group.evalStatistics[rawEval.id].minMarkOutOf20, 2)
              : "-",
        },
        maxMark: {
          rawContent:
            group &&
            group.evalStatistics[rawEval.id] &&
            group.evalStatistics[rawEval.id].maxMark !== undefined
              ? group.evalStatistics[rawEval.id].maxMark
              : "",
          content:
            group &&
            group.evalStatistics[rawEval.id] &&
            group.evalStatistics[rawEval.id].maxMark !== undefined
              ? roundNum(group.evalStatistics[rawEval.id].maxMarkOutOf20, 2)
              : "-",
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
                exportOneToXLSX(rawEval.id);
              }}
              isFlat
            />,
          ],
        },
      })),
    [rawEvaluations, cbp, groupId, group, exportOneToXLSX]
  );

  const evaluationsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Date de création", value: "creationDate" },
      { text: "Titre", value: "title" },
      { text: "Coefficient", value: "coefficient", alignContent: "center" },
      { text: "Moyenne", value: "groupAverage", alignContent: "center" },
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
            [
              `${group.name} - ${group.actualSubject.slice(0, 3)} - ${group.shortenedLevel} - ${
                group.shortenedSchoolYear
              }`,
              `/groups/${group.id}`,
            ],
          ]
        : [],
    [group]
  );

  return (
    <Container className={cx("groupDashboard")}>
      <Head>
        <title>Tableau de bord de groupe - ExploraNotes</title>
      </Head>

      {!isAuthenticated && (
        <h1 className={cn("pageTitle text-center", cx("groupNotFound"))}>
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
              `${group.name} - ${group.actualSubject} - ${group.shortenedLevel} - ${group.shortenedSchoolYear} - Tableau de bord`) ||
              "Détails du groupe - Chargement..."}
          </h1>

          <div className={cx("evaluationSection", cbp)}>
            <h2>Évaluations associées</h2>
            <Button
              className={cn("blue darken-3 text-center", cx("exportButton"))}
              onClick={() => {
                exportAllToXLSX();
              }}
            >
              Exporter tout
            </Button>
          </div>

          <p className={cx("note20points")}>
            Les notes de ce tableau sont exprimées sur 20 points.
          </p>

          <DataTable
            headers={evaluationsTableHeaders}
            items={evaluations}
            sortBy="creationDate"
            sortOrder={SortOrder.DESC}
          />

          <h2>Élèves du groupe</h2>

          <p className={cx("note20points")}>
            Les notes de ce tableau sont exprimées sur 20 points.
          </p>

          <StudentsTable />
        </>
      )}
    </Container>
  );
}
