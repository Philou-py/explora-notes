"use client";

import { useCallback, useState } from "react";
import Dialog from "@/components/Dialog";
import AddStudentsForm from "./AddStudentsForm";
import Button from "@/components/Button";

export default function AddStudents() {
  const [aSDialogOpen, setASDialogOpen] = useState(false);
  const openASDialog = useCallback(() => setASDialogOpen(true), []);
  const closeASDialog = useCallback(() => setASDialogOpen(false), []);

  return (
    <>
      <Button
        type="elevated"
        className="blue darken-2"
        onClick={openASDialog}
        style={{ margin: "20px auto" }}
      >
        Ajouter des élèves
      </Button>
      <Dialog showDialog={aSDialogOpen}>
        <AddStudentsForm closeASDialog={closeASDialog} />
      </Dialog>
    </>
  );
}
