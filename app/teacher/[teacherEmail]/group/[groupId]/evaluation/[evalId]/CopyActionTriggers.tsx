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
          iconName="post_add"
          className="purple--text"
          onClick={() => {
            setAction({ actionType: "createCopy", info: { studentId } });
          }}
        />
      )}

      {copyId && (
        <>
          <Button
            type="icon"
            size="small"
            iconName="post_add"
            className="purple--text"
            onClick={() => {
              setAction({ actionType: "editCopy", info: { studentId, copyId } });
            }}
          />

          <Button
            type="icon"
            size="small"
            iconName="delete"
            className="red--text"
            style={{ marginLeft: 5 }}
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
