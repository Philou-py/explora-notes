import { useState } from "react";
import { useParams } from "next/navigation";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import cn from "classnames/bind";
import { useHandleMutation } from "@/app/useHandleMutation";
import joinGroupStyles from "./JoinGroup.module.scss";

const cx = cn.bind(joinGroupStyles);

export default function JoinGroupForm({ closeDialog }: { closeDialog: () => void }) {
  const { studentEmail } = useParams();
  const { submitAction, isLoading } = useHandleMutation(closeDialog);
  const [studentJWT, setStudentJWT] = useState("");

  return (
    <Card className={cx("joinGroupCard")}>
      <Form
        onSubmit={() => submitAction(`/student/${studentEmail}/join-group`, "POST", { studentJWT })}
      >
        <CardHeader title={<h2>Rejoindre un groupe</h2>} centerTitle />
        <CardContent>
          <InputField
            type="text"
            label="Token d'identification"
            placeholder="Texte copié du QR code"
            prependIcon="key"
            isRequired
            value={studentJWT}
            setValue={setStudentJWT}
            maxLength={1000}
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
            isDisabled={!studentJWT}
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
