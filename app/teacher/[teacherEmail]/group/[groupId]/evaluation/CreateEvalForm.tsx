import { useState, useEffect, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { SideBarContext, TemplateForGr } from "@/contexts/SideBarContext";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import CreateEvalScale from "./CreateEvalScale";
import cn from "classnames/bind";
import createEvalFormStyles from "./CreateEvalForm.module.scss";
import { useHandleMutation } from "@/app/useHandleMutation";

const cx = cn.bind(createEvalFormStyles);

const precisionsForSelect = [
  ["0.25", "0.25"],
  ["0.5", "0.5"],
  ["1.0", "1"],
  ["2.0", "2"],
];

const coefficientForSelect = [...Array(21).keys()].map((i) => [
  (0.5 * i).toString(),
  (0.5 * i).toString(),
]);

export default function CreateEvalForm({ closeDialog }: { closeDialog: () => void }) {
  const { teacherEmail } = useParams();
  const { createEvalTemplate: template, isEditingEval: ed } = useContext(SideBarContext);

  const {
    data: newEval,
    setData: setNewEval,
    isValid,
    register,
  } = useForm({ title: "", markPrecision: "0.5", coefficient: "1" });

  const [scale, setScale] = useState<TemplateForGr["categories"]>([]);
  const [criteriaToObserve, setCriteriaToObserve] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      setNewEval({
        title: ed ? template.title : "",
        markPrecision: template.markPrecision,
        coefficient: template.coefficient,
      });
    }
  }, [template, setNewEval, ed]);

  const { submitAction, isLoading } = useHandleMutation(closeDialog);
  const handleOnSubmit = () => {
    if (!template) return;
    const newEvalToSend = { ...newEval, categories: scale, criteriaToObserve };
    if (!ed) {
      submitAction(
        `/teacher/${teacherEmail}/group/${template.groupId}/evaluation/create-eval`,
        "POST",
        newEvalToSend,
        true
      );
    } else if (ed === "detailed") {
      const handleDeleteCreate = async () => {
        await fetch(
          `/teacher/${teacherEmail}/group/${template.groupId}/evaluation/${template.id}/delete-eval`,
          { method: "DELETE" }
        );
        submitAction(
          `/teacher/${teacherEmail}/group/${template.groupId}/evaluation/create-eval`,
          "POST",
          newEvalToSend,
          true
        );
      };
      handleDeleteCreate();
    } else if (ed === "simple") {
      submitAction(
        `/teacher/${teacherEmail}/group/${template.groupId}/evaluation/${template.id}/update-eval`,
        "POST",
        newEvalToSend
      );
    }
  };

  return (
    <Card className={cx("createEvalCard")}>
      <Form onSubmit={handleOnSubmit}>
        <CardHeader
          title={<h2>{ed ? "Modifier une évaluation" : "Créer un barème"}</h2>}
          subtitle={template && <h3>{template.groupName}</h3>}
        />
        <CardContent>
          <fieldset className={cx("generalInfo")}>
            <legend>Informations générales</legend>
            <InputField
              type="text"
              label="Titre de l&rsquo;évaluation"
              placeholder="Ex : Évaluation N°7"
              prependIcon="title"
              isRequired
              {...register("title")}
            />
            <InputField
              type="select"
              label="Intervalle de notation"
              prependIcon="precision_manufacturing"
              selectItems={precisionsForSelect}
              isDisabled={ed === "simple"}
              isRequired
              {...register("markPrecision")}
            />
            <InputField
              type="select"
              label="Coefficient de la note ramenée sur 20"
              prependIcon="weight"
              selectItems={coefficientForSelect}
              isRequired
              {...register("coefficient")}
            />
            <p>Les notes des copies seront ramenées sur 20 points.</p>
          </fieldset>

          <fieldset className={cx("scale")}>
            <legend>Barème</legend>
            <CreateEvalScale
              scale={scale}
              setScale={setScale}
              markPrecision={Number(newEval.markPrecision)}
              setCriteriaToObserve={setCriteriaToObserve}
            />
          </fieldset>
        </CardContent>
        <CardActions>
          <Spacer />
          <Button className="red--text mr-3" type="outlined" onClick={closeDialog}>
            Annuler
          </Button>
          <Button
            type="elevated"
            className="blue darken-3"
            isDisabled={!isValid}
            isLoading={isLoading}
            formSubmit
          >
            Valider
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}
