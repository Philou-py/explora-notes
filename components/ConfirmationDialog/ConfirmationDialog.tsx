import { memo, useCallback } from "react";
import Dialog from "../Dialog";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import confirmationDialogStyles from "./ConfirmationDialog.module.scss";
import cn from "classnames/bind";
import { useHandleMutation } from "@/app/useHandleMutation";

const cx = cn.bind(confirmationDialogStyles);

interface Props {
  showDialog: boolean;
  setShowDialog: (_: boolean) => void;
  msg: string;
  submitArgs: [string, string, object];
}

function ConfirmationDialog({ showDialog, setShowDialog, msg, submitArgs }: Props) {
  const closeDialog = useCallback(() => setShowDialog(false), [setShowDialog]);
  const { submitAction, isLoading } = useHandleMutation(closeDialog);

  return (
    <Dialog showDialog={showDialog}>
      <Card className={cx("confirmationCard")}>
        <CardHeader title={<h3>{msg}</h3>} centerTitle />
        <CardContent />
        <CardActions>
          <Spacer />
          <Button
            className="red--text mr-3"
            type="outlined"
            prependIcon="close"
            onClick={closeDialog}
          >
            Annuler
          </Button>
          <Button
            type="elevated"
            className="blue darken-3"
            isLoading={isLoading}
            prependIcon="thumb_up"
            onClick={() => submitAction(...submitArgs)}
          >
            Bien sûr !
          </Button>
        </CardActions>
      </Card>
    </Dialog>
  );
}

export default memo(ConfirmationDialog);
