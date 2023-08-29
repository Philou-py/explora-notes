"use client";

import { useCallback, useState } from "react";
import Dialog from "@/components/Dialog";
import AddStudentsForm from "./AddStudentsForm";
import Button from "@/components/Button";

export default function AddStudentsProvider({ groupId }) {
  const [aSDialogOpen, setASDialogOpen] = useState(false);
  const openASDialog = useCallback(() => setASDialogOpen(true), []);
  const closeASDialog = useCallback(() => setASDialogOpen(false), []);

  return (
    <>
      <Button type="elevated" className="blue darken-2" onClick={openASDialog}>
        Ajouter des élèves
      </Button>
      <Dialog showDialog={aSDialogOpen}>
        <AddStudentsForm groupId={groupId} closeASDialog={closeASDialog} />
      </Dialog>
    </>
  );
}
