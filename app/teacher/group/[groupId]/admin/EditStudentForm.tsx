import { useEffect } from "react";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import editStudentFormStyles from "./EditStudentForm.module.scss";
import cn from "classnames/bind";
import { useHandleMutation } from "@/app/useHandleMutation";
import { useParams } from "next/navigation";

const cx = cn.bind(editStudentFormStyles);

interface CurrentStudent {
  id: string;
  firstName: string;
  lastName: string;
}

export default function EditStudentForm({
  currentStudent,
  closeDialog,
}: {
  currentStudent: CurrentStudent;
  closeDialog: () => void;
}) {
  const { groupId } = useParams();
  const { submitAction, isLoading } = useHandleMutation(closeDialog);
  const {
    data: student,
    setData: setStudent,
    register,
    isValid,
  } = useForm({ lastName: "", firstName: "" });

  useEffect(() => {
    setStudent({ lastName: currentStudent.lastName, firstName: currentStudent.firstName });
  }, [currentStudent, setStudent]);

  return (
    <Card className={cx("editStudentCard")}>
      <Form
        onSubmit={() =>
          submitAction(`/teacher/group/${groupId}/admin/edit-student`, "PUT", {
            id: currentStudent.id,
            ...student,
          })
        }
      >
        <CardHeader title={<h2>Modifier un élève</h2>} centerTitle />
        <CardContent className={cx("nameInput")}>
          <InputField
            type="text"
            label="Nom de famille"
            prependIcon="badge"
            isRequired
            {...register("lastName")}
          />
          <InputField
            type="text"
            label="Prénom"
            prependIcon="face"
            isRequired
            {...register("firstName")}
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
