"use client";

import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import cn from "classnames/bind";
import createGroupFormStyles from "./CreateGroupForm.module.scss";
import { useQuickAction } from "@/app/@qa/useQuickAction";

const cx = cn.bind(createGroupFormStyles);

export default function CreateGroupForm({ teacherEmail }: { teacherEmail: string }) {
  const { submitAction, isLoading, cancelAction } = useQuickAction();

  const {
    data: newGroup,
    isValid,
    register,
  } = useForm({
    name: "",
    subject: "",
    level: "",
  });

  return (
    <Card className={cx("createGroupCard")}>
      <Form
        onSubmit={() => submitAction("/api/group-actions/create-group", { teacherEmail, newGroup })}
      >
        <CardHeader title={<h2>Créer un groupe</h2>} centerTitle />
        <CardContent>
          <InputField
            type="text"
            label="Nom du groupe"
            prependIcon="face"
            maxLength={20}
            isRequired
            {...register("name")}
          />
          <InputField
            type="text"
            label="Matière"
            prependIcon="subject"
            maxLength={50}
            isRequired
            {...register("subject")}
          />
          <InputField
            type="text"
            label="Niveau"
            prependIcon="school"
            maxLength={40}
            isRequired
            {...register("level")}
          />
        </CardContent>

        <CardActions>
          <Spacer />
          <Button className="red--text mr-4" type="outlined" onClick={cancelAction}>
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
