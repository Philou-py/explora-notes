"use client";

import Dialog from "@/components/Dialog";
import { useContext } from "react";
import { ActionContext } from "./ActionContext";
import { Copy } from "./CopyDialog";
import { Scale } from "./StudentMarksTable";

interface Props {
  copy: Copy;
  scale: Scale;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function CopyForm({ copy, scale, student }: Props) {
  const { action } = useContext(ActionContext);

  return (
    <Dialog showDialog={action.info.studentId === student.id}>
      <h1>Hello</h1>
    </Dialog>
  );
}
