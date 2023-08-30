"use client";

import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import cn from "classnames/bind";
import createGroupFormStyles from "./CreateGroupForm.module.scss";
import { useHandleMutation } from "@/app/useHandleMutation";
import { useCallback } from "react";

const cx = cn.bind(createGroupFormStyles);

export default function CreateGroupForm({ closeDialog }) {
  const {
    data: newGroup,
    setData: setNewGroup,
    isValid,
    register,
  } = useForm({
    name: "",
    subject: "",
    level: "",
  });

  const resetForm = useCallback(() => {
    setNewGroup({ name: "", subject: "", level: "" });
  }, [setNewGroup]);

  const { submitAction, isLoading } = useHandleMutation(closeDialog, resetForm);

  return (
    <Card className={cx("createGroupCard")}>
      <Form onSubmit={() => submitAction("/teacher/group/create-group", "POST", newGroup)}>
        <CardHeader title={<h2>Créer un groupe</h2>} centerTitle />
        <CardContent>
          <InputField
            type="text"
            label="Nom du groupe"
            placeholder="Ex : Groupe Spé N°7"
            prependIcon="face"
            maxLength={20}
            isRequired
            {...register("name")}
          />
          <InputField
            type="text"
            label="Matière"
            placeholder="Ex : Physique-chimie"
            prependIcon="subject"
            maxLength={50}
            isRequired
            {...register("subject")}
          />
          <InputField
            type="text"
            label="Niveau"
            placeholder="Terminale"
            prependIcon="school"
            maxLength={40}
            isRequired
            {...register("level")}
          />
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
