import Container from "@/components/Container";
import evalStyles from "./Evaluation.module.scss";
import cn from "classnames/bind";
import ActionContextProvider from "./ActionContext";
import StudentMarksTable from "./StudentMarksTable";
import { dgraphQuery } from "@/app/dgraphQuery";
import EditEvalTrigger from "./EditEvalTrigger";
import DeleteEvalButton from "./DeleteEvalButton";
import ExportEvalButton from "./ExportEvalButton";

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

const GET_GROUP = `
  query($groupId: ID!) {
    getGroup(id: $groupId) {
      name
    }
  }
`;

interface Group {
  name: string;
}

async function fetchEval(evalId: string): Promise<Evaluation> {
  return await dgraphQuery(GET_EVAL, { evalId }, "getEvaluation", `getEvalTitle-${evalId}`);
}

async function fetchGroup(groupId: string): Promise<Group> {
  return await dgraphQuery(GET_GROUP, { groupId }, "getGroup", `getGroupName-${groupId}`);
}

export default async function Page({ params: { groupId, evalId } }) {
  const evaluation = await fetchEval(evalId);
  const { name: groupName } = await fetchGroup(groupId);

  return (
    <Container className={cx("evaluation")} narrow>
      <h1>{evaluation.title}</h1>
      <ActionContextProvider>
        <section>
          <h2 className={cx("editEvalTrigger")}>
            Résultats par élève
            <EditEvalTrigger evalId={evalId} groupId={groupId} groupName={groupName} />
          </h2>
          <StudentMarksTable evalId={evalId} />
        </section>
        <div className={cx("evalButtons")}>
          <DeleteEvalButton />
          <ExportEvalButton evalTitle={evaluation.title} groupName={groupName} />
        </div>
      </ActionContextProvider>
    </Container>
  );
}
