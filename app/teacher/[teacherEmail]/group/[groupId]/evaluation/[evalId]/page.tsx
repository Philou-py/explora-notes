import Container from "@/components/Container";
import evalStyles from "./Evaluation.module.scss";
import cn from "classnames/bind";
import ActionContextProvider from "./ActionContext";
import StudentMarksTable from "./StudentMarksTable";
import { dgraphQuery } from "@/app/dgraphQuery";

const cx = cn.bind(evalStyles);

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      title
    }
  }
`;

interface Evaluation {
  title: string;
}

async function fetchEval(evalId: string): Promise<Evaluation> {
  return await dgraphQuery(GET_EVAL, { evalId }, "getEvaluation", `getEvalTitle-${evalId}`);
}

export default async function Page({ params: { evalId } }) {
  const evaluation = await fetchEval(evalId);

  return (
    <Container>
      <h1>{evaluation.title}</h1>
      <ActionContextProvider>
        <section>
          <h2>Résultats par élève</h2>
          <StudentMarksTable evalId={evalId} />
        </section>
      </ActionContextProvider>
    </Container>
  );
}
