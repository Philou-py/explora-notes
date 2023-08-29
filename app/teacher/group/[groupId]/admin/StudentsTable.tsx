"use client";

import { useContext, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { ConfirmationContext } from "@/contexts/ConfirmationContext";
import Dialog from "@/components/Dialog";
import Button from "@/components/Button";
import DataTable, { TableHeader } from "@/components/DataTable";
import EditStudentForm from "./EditStudentForm";

interface GroupStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentAccount?: {
    username: string;
  };
}

export default function StudentsTable({ groupStudents }: { groupStudents: GroupStudent[] }) {
  const { groupId } = useParams();
  const promptConfirmation = useContext(ConfirmationContext);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const closeEditDialog = useCallback(() => setShowEditDialog(false), []);

  const [currentStudent, setCurrentStudent] = useState({ id: "", firstName: "", lastName: "" });

  const studentsTableHeaders: TableHeader[] = [
    { text: "Nom de famille", value: "lastName" },
    { text: "Prénom", value: "firstName" },
    { text: "Actions", value: "actions", alignContent: "center", isSortable: false },
  ];

  const studentsTableItems = groupStudents.map((groupStudent) => ({
    key: { rawContent: groupStudent.id },
    firstName: { rawContent: groupStudent.firstName },
    lastName: { rawContent: groupStudent.lastName },
    actions: {
      rawContent: "",
      content: [
        <Button
          key={`${groupStudent}--edit`}
          type="icon"
          size="small"
          iconName="edit"
          className="purple--text"
          onClick={() => {
            setCurrentStudent({ ...groupStudent });
            setShowEditDialog(true);
          }}
        />,
        <Button
          key={`${groupStudent}--delete`}
          type="icon"
          size="small"
          iconName="delete"
          className="red--text"
          style={{ marginLeft: 5 }}
          onClick={() =>
            promptConfirmation(
              "Voulez-vous vraiment retirer cet élève du groupe ?",
              `/teacher/group/${groupId}/admin/delete-student`,
              "DELETE",
              { groupStudentId: groupStudent.id }
            )
          }
        />,
      ],
    },
  }));

  return (
    <>
      <Dialog showDialog={showEditDialog}>
        <EditStudentForm currentStudent={currentStudent} closeDialog={closeEditDialog} />
      </Dialog>
      <DataTable
        headers={studentsTableHeaders}
        items={studentsTableItems}
        sortBy="lastName"
        lineNumbering
      />
    </>
  );
}
