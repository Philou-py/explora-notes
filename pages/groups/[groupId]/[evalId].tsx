import Head from "next/head";
import { useContext, useMemo } from "react";
import { TeacherContext } from "../../../contexts/TeacherContext";
import { useRouter } from "next/router";
import ExerciseTable from "../../../layouts/ExerciseTable";
import MarksTable from "../../../layouts/MarksTable";
import { Container, BreadCrumbs } from "../../../components";
import evalForGroupDetailsStyles from "../../../pageStyles/EvalForGroupDetails.module.scss";
import cn from "classnames/bind";
import { roundNum } from "../../../helpers/roundNum";

const cx = cn.bind(evalForGroupDetailsStyles);

export default function EvalForGroupDetails() {
  const router = useRouter();
  const { groupId, evalId } = router.query as { evalId: string; groupId: string };
  const { evaluationMap, groupMap } = useContext(TeacherContext);

  const group = useMemo(() => groupMap[groupId], [groupMap, groupId]);
  const evaluation = useMemo(() => evaluationMap[evalId], [evaluationMap, evalId]);
  const notFound = useMemo(() => {
    return !(
      evalId &&
      groupId &&
      evaluationMap[evalId] &&
      evaluationMap[evalId].associatedGroupIds.includes(groupId)
    );
  }, [evaluationMap, groupId, evalId]);

  const evalStatistics = useMemo(
    () =>
      !notFound &&
      !!group.evalStatistics[evalId] &&
      Object.values(group.evalStatistics[evalId]).length !== 0 &&
      group.evalStatistics[evalId],
    [notFound, group, evalId]
  );

  const breadCrumbItems = useMemo<[string, string][]>(
    () =>
      group && evaluation
        ? [
            ["Groupes", "/groups"],
            [
              `${group.name} - ${group.actualSubject.slice(0, 3)} - ${group.shortenedLevel} - ${
                group.shortenedSchoolYear
              }`,
              `/groups/${group.id}`,
            ],
            [evaluation.title, `/groups/${groupId}/${evalId}`],
          ]
        : [],
    [group, groupId, evalId, evaluation]
  );

  return (
    <Container className={cx("evalForGroupDetails")}>
      <Head>
        <title>Détails de l&rsquo;évaluation - ExploraNotes</title>
      </Head>

      {notFound && (
        <h3 className={cx("groupNotFound")}>
          Oups ! Le groupe ou l&rsquo;évaluation n&rsquo;existent pas, ou bien vous n&rsquo;avez pas
          la permission de consulter leurs détails ! Vérifiez que vous êtes bien connecté !
        </h3>
      )}
      {!notFound && (
        <>
          <BreadCrumbs items={breadCrumbItems} namespace="EvaluationDetailsForGroup" />
          <h1 className="pageTitle text-center">
            {evaluation && `${evaluation.title} - `}Détails de l&rsquo;évaluation
            {group && ` pour ${group.name} ${group.schoolYear}`}
          </h1>

          {evalStatistics && <h2>Vue d&rsquo;ensemble des résultats</h2>}

          {evaluation && evalStatistics && (
            <ul className={cx("evalStatistics")}>
              <li>
                Moyenne du groupe : {roundNum(evalStatistics.average, 2)} / {evaluation.totalPoints}
                {evaluation.totalPoints !== 20 &&
                  ` - ${roundNum(evalStatistics.averageOutOf20, 2)} / 20`}
              </li>
              <li>
                Note minimale : {roundNum(evalStatistics.minMark, 2)} / {evaluation.totalPoints}
                {evaluation.totalPoints !== 20 &&
                  ` - ${roundNum(evalStatistics.minMarkOutOf20, 2)} / 20`}
              </li>
              <li>
                Note maximale : {roundNum(evalStatistics.maxMark, 2)} / {evaluation.totalPoints}
                {evaluation.totalPoints !== 20 &&
                  ` - ${roundNum(evalStatistics.maxMarkOutOf20, 2)} / 20`}
              </li>
            </ul>
          )}

          {evaluation && evalStatistics && <ExerciseTable />}

          <h2>Liste des notes par élève</h2>

          <MarksTable />
        </>
      )}
    </Container>
  );
}
