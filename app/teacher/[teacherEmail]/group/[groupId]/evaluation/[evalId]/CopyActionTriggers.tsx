"use client";

import { useContext } from "react";
import Button from "@/components/Button";
import { ActionContext } from "./ActionContext";
import { ConfirmationContext } from "@/contexts/ConfirmationContext";
import { useParams } from "next/navigation";

interface Props {
  copyId: string;
  studentId: string;
  studentName: string;
}

export default function CopyActionTriggers({ copyId, studentId, studentName }: Props) {
  const { teacherEmail, groupId, evalId } = useParams();
  const { setAction } = useContext(ActionContext);
  const promptConfirmation = useContext(ConfirmationContext);

  return (
    <>
      {!copyId && (
        <Button
          type="icon"
          size="small"
          iconName="note_add"
          className="purple--text"
          onClick={() => {
            setAction({ type: "createCopy", info: { copyId, studentId, studentName } });
          }}
        />
      )}

      {copyId && (
        <>
          <Button
            type="icon"
            size="small"
            iconName="edit_note"
            className="purple--text"
            onClick={() => {
              setAction({ type: "editCopy", info: { copyId, studentId, studentName } });
            }}
          />

          <Button
            type="icon"
            size="small"
            iconName="delete"
            className="red--text"
            onClick={() =>
              promptConfirmation(
                `Confirmez-vous vouloir supprimer la copie de ${studentName} ?`,
                `/teacher/${teacherEmail}/group/${groupId}/evaluation/${evalId}/delete-copy`,
                "DELETE",
                { copyId }
              )
            }
          />
        </>
      )}
    </>
  );
}
