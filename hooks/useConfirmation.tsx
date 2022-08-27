import { useCallback, useState } from "react";
import { Modal, Card, CardHeader, CardActions, Spacer, Button, CardContent } from "../components";

export const useConfirmation = () => {
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState(
    "Êtes-vous certain(e) de vouloir effectuer cette action ?"
  );
  const [onConfirm, setOnConfirm] = useState<() => void>();
  const [onCancel, setOnCancel] = useState<() => void>();

  const promptConfirmation = useCallback(
    (text: string, onConfirm: () => void, onCancel?: () => void) => {
      setConfirmationText(text);
      setOnConfirm(() => onConfirm);
      setOnCancel(() => onCancel);
      setConfirmationModalOpen(true);
    },
    []
  );

  const handleCancel = useCallback(() => {
    setConfirmationModalOpen(false);
    if (onCancel) onCancel();
  }, [onCancel]);

  const handleProceed = useCallback(() => {
    setConfirmationModalOpen(false);
    onConfirm();
  }, [onConfirm]);

  const confirmModalTemplate = (
    <Modal showModal={confirmationModalOpen}>
      <Card cssWidth="clamp(50px, 510px, 95%)">
        <CardHeader title={<h3>{confirmationText}</h3>} centerTitle />
        <CardContent />
        <CardActions>
          <Spacer />
          <Button
            className="red--text mr-4"
            type="outlined"
            onClick={handleCancel}
            prependIcon="close"
          >
            Non !
          </Button>
          <Button className="blue darken-3" onClick={handleProceed} prependIcon="thumb_up">
            Bien sûr !
          </Button>
          <Spacer />
        </CardActions>
      </Card>
    </Modal>
  );

  return { confirmModalTemplate, promptConfirmation };
};
