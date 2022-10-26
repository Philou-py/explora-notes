import { useContext, useMemo, memo } from "react";
import { useRouter } from "next/router";
import { TeacherContext, Copy } from "../contexts/TeacherContext";
import { DataTable, TableHeader } from "../components";
import { roundNum } from "../helpers/roundNum";

function ExerciseTable() {
  const router = useRouter();
  const { groupId, evalId } = router.query as { groupId: string; evalId: string };
  const { evaluationMap, groupMap } = useContext(TeacherContext);

  const notFound = useMemo(() => {
    return !(
      groupId &&
      groupMap[groupId] &&
      evalId &&
      evaluationMap[evalId] &&
      evaluationMap[evalId].associatedGroupIds.includes(groupId)
    );
  }, [evaluationMap, groupId, evalId, groupMap]);

  const copyMapPerStudent = useMemo<{ [sId: string]: Copy }>(
    () =>
      !notFound && evaluationMap[evalId].copies[groupId]
        ? evaluationMap[evalId].copies[groupId]
        : {},
    [notFound, evaluationMap, groupId, evalId]
  );

  const exTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Exercice", value: "exId", isSortable: false },
      { text: "Moyenne", value: "avMarkForEx", alignContent: "center", isSortable: false },
      { text: "Note min", value: "minMarkForEx", alignContent: "center", isSortable: false },
      { text: "Note max", value: "maxMarkForEx", alignContent: "center", isSortable: false },
    ],
    []
  );

  const exAvs = useMemo(
    () =>
      !notFound &&
      groupMap[groupId].evalStatistics[evalId] &&
      groupMap[groupId].evalStatistics[evalId].exerciseAverages
        ? groupMap[groupId].evalStatistics[evalId].exerciseAverages
        : [],
    [evalId, groupId, groupMap, notFound]
  );

  const exTableItems = useMemo(
    () =>
      exAvs.map((avOfEx, exIndex) => ({
        key: { rawContent: exIndex },
        exId: {
          rawContent: `Exercice ${exIndex + 1} (${
            evaluationMap[evalId].exerciseScale[exIndex]
          } pts)`,
        },
        avMarkForEx: {
          rawContent: avOfEx,
          content: roundNum(avOfEx, 2),
        },
        minMarkForEx: {
          rawContent: Math.min(
            ...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])
          ),
          content: Math.min(...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])),
        },
        maxMarkForEx: {
          rawContent: Math.max(
            ...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])
          ),
          content: Math.max(...Object.values(copyMapPerStudent).map((c) => c.pointsByEx[exIndex])),
        },
      })),
    [evalId, evaluationMap, copyMapPerStudent, exAvs]
  );

  return <DataTable headers={exTableHeaders} items={exTableItems} sortBy="exId" />;
}

export default memo(ExerciseTable);
