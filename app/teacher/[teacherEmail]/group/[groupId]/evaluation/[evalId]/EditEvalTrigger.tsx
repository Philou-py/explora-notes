"use client";

import { useCallback, useContext } from "react";
import { SideBarContext, TemplateForGr } from "@/contexts/SideBarContext";
import Button from "@/components/Button";

export default function EditEvalTrigger({ evalId, groupId, groupName }) {
  const { setIsEditingEval, setCreateEvalTemplate } = useContext(SideBarContext);
  const editEval = useCallback(() => {
    async function getEval() {
      const response = await fetch(`/teacher/eval/${evalId}`);
      const { evaluation } = await response.json();
      const evalAsTemplate: TemplateForGr = {
        ...evaluation,
        markPrecision: evaluation.markPrecision.toString(),
        coefficient: evaluation.coefficient.toString(),
        groupId,
        groupName,
      };
      evalAsTemplate.categories.sort((a, b) => a.rank - b.rank);
      evalAsTemplate.categories.forEach((cat) => cat.criteria.sort((a, b) => a.rank - b.rank));
      setIsEditingEval(evaluation.copiesAggregate.count === 0 ? "detailed" : "simple");
      setCreateEvalTemplate(evalAsTemplate);
    }
    getEval();
  }, [setIsEditingEval, setCreateEvalTemplate, evalId, groupId, groupName]);

  return (
    <Button type="elevated" className="blue darken-2" onClick={editEval}>
      Modifier le barème
    </Button>
  );
}
