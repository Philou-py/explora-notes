import Container from "@/components/Container";
import evalStyles from "./Evaluation.module.scss";
import cn from "classnames/bind";
import ActionContextProvider from "./ActionContext";
import StudentMarksTable from "./StudentMarksTable";
import { dgraphQuery } from "@/app/dgraphQuery";
import EditEvalTrigger from "./EditEvalTrigger";
import DeleteEvalButton from "./DeleteEvalButton";
import ExportEvalButton from "./ExportEvalButton";
import PublishEvalButton from "./PublishEvalButton";

const cx = cn.bind(evalStyles);

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      title
    }
  }
`;

const GET_EVAL_PUBLISHED = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      isPublished
    }
  }
`;

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

async function fetchEvalTitle(evalId: string): Promise<string> {
  const e = await dgraphQuery(GET_EVAL, { evalId }, "getEvaluation", `getEvalTitle-${evalId}`);
  return e.title;
}

async function fetchEvalPublished(evalId: string): Promise<boolean> {
  const e = await dgraphQuery(
    GET_EVAL_PUBLISHED,
    { evalId },
    "getEvaluation",
    `getEvalPublished-${evalId}`
  );
  return e.isPublished;
}

async function fetchGroup(groupId: string): Promise<Group> {
  return await dgraphQuery(GET_GROUP, { groupId }, "getGroup", `getGroupName-${groupId}`);
}

export default async function Page({ params: { groupId, evalId } }) {
  const evalTitle = await fetchEvalTitle(evalId);
  const { name: groupName } = await fetchGroup(groupId);
  const isPublished = await fetchEvalPublished(evalId);
  console.log(isPublished);

  return (
    <Container className={cx("evaluation")} narrow>
      <h1>{evalTitle}</h1>
      <ActionContextProvider>
        <section>
          <h2 className={cx("editEvalTrigger")}>
            Résultats par élève
            <EditEvalTrigger evalId={evalId} groupId={groupId} groupName={groupName} />
          </h2>
          <StudentMarksTable evalId={evalId} />
        </section>
        <div className={cx("evalButtons")}>
          <div className={cx("publish")}>
            <PublishEvalButton isPublished={isPublished} />
          </div>
          <div className={cx("exportDelete")}>
            <DeleteEvalButton />
            <ExportEvalButton evalTitle={evalTitle} groupName={groupName} />
          </div>
        </div>
      </ActionContextProvider>
    </Container>
  );
}
