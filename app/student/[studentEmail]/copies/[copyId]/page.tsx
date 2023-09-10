import { dgraphQuery } from "@/app/dgraphQuery";
import Container from "@/components/Container";
import cn from "classnames/bind";
import copyStyles from "./Copy.module.scss";
import { roundNum } from "@/helpers/roundNum";
import { notFound } from "next/navigation";
import { DGRAPH_URL } from "@/config";

const cx = cn.bind(copyStyles);

interface Copy {
  groupStudent: {
    id: string;
  };
  totalPoints: number;
  mark: number;
  bonusPoints: number;
  penaltyPoints: number;
  categoryResults: {
    id: string;
    points: number;
    category: { rank: number; label: string; maxPoints: number };
    criterionResults: {
      id: string;
      points: number;
      criterion: { rank: number; label: string; maxPoints: number };
    }[];
  }[];
  evaluation: {
    id: string;
    title: string;
    totalPoints: number;
    isPublished: boolean;
  };
}

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      title
      totalPoints
      isPublished
    }
  }
`;

const GET_COPY = `
  query($copyId: ID!) {
    getCopy(id: $copyId) {
      groupStudent {
        id
      }
      totalPoints
      mark
      bonusPoints
      penaltyPoints
      categoryResults {
        id
        points
        category {
          rank
          label
          maxPoints
        }
        criterionResults {
          id
          points
          criterion {
            rank
            label
            maxPoints
          }
        }
      }
      evaluation {
        id
      }
    }
  }
`;

async function getCopy(copyId: string): Promise<Copy> {
  const copy: Copy = await dgraphQuery(GET_COPY, { copyId }, "getCopy", "getCopy-" + copyId);
  if (!copy) notFound();
  const evalId = copy.evaluation.id;
  const dgraphResponse = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GET_EVAL, variables: { evalId } }),
    cache: "force-cache",
    next: { tags: ["getEvalTitle-" + evalId, "getEvalPublished-" + evalId] },
  });

  const result = await dgraphResponse.json();
  const evaluation = result.data.getEvaluation;
  if (!evaluation.isPublished) notFound();
  copy.evaluation = { id: evalId, ...evaluation };
  // Sort categoryResults and criterionResults
  copy.categoryResults.sort((a, b) => a.category.rank - b.category.rank);
  copy.categoryResults.forEach((catRes) => {
    catRes.criterionResults.sort((a, b) => a.criterion.rank - b.criterion.rank);
  });
  return copy;
}

export default async function Page({ params: { copyId } }) {
  const copy = await getCopy(copyId);

  return (
    <Container className={cx("copyDisplay")} xNarrow>
      <h1>Détails de la copie - {copy.evaluation.title}</h1>
      <h2 className={cx("markSummary")}>
        Note : {copy.totalPoints} / {copy.evaluation.totalPoints}
        {copy.evaluation.totalPoints !== 20 && ` - ${roundNum(copy.mark, 2)} / 20`}
      </h2>
      <div className={cx("results")}>
        {copy.categoryResults.map((catRes) => (
          <div className={cx("categoryResult")} key={catRes.id}>
            <p className={cx("category")}>
              {catRes.category.label} : {catRes.points} / {catRes.category.maxPoints}
            </p>
            <ul className={cx("criteria")}>
              {catRes.criterionResults.map((critRes) => (
                <li key={critRes.id}>
                  {critRes.criterion.label} :{" "}
                  {critRes.points === -1 ? "Non traité" : critRes.points} /{" "}
                  {critRes.criterion.maxPoints}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Container>
  );
}
