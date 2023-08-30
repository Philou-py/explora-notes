"use client";

import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import cn from "classnames/bind";
import addStudentsFormStyles from "./AddStudentsForm.module.scss";
import { useHandleMutation } from "@/app/useHandleMutation";

const cx = cn.bind(addStudentsFormStyles);

interface NewGroupStudent {
  firstName: string;
  lastName: string;
}

export default function AddStudentsForm({ closeASDialog }) {
  const { teacherEmail, groupId } = useParams();
  const [students, setStudents] = useState<(NewGroupStudent | null)[]>([
    { firstName: "", lastName: "" },
  ]);

  const [nbStudents, setNbStudents] = useState(1);

  const resetForm = useCallback(() => {
    setStudents((prev) => {
      // Don't reuse indexes
      const emptyCopy = prev.map((_) => null);
      emptyCopy.push({ firstName: "", lastName: "" });
      return emptyCopy;
    });
    setNbStudents(1);
  }, []);

  const { submitAction, isLoading } = useHandleMutation(closeASDialog, resetForm);

  const handleAddStudent = useCallback(() => {
    setStudents((prev) => [...prev, { firstName: "", lastName: "" }]);
    setNbStudents((prev) => prev + 1);
  }, []);

  const handleRemoveStudent = useCallback(
    (i: number) => {
      if (nbStudents > 1) {
        setStudents((prev) => {
          const copy = [...prev];
          copy[i] = null;
          return copy;
        });
        setNbStudents((nb) => nb - 1);
      }
    },
    [nbStudents]
  );

  const studentsTemplate = [...Array(students.length).keys()].map(
    (i) =>
      students[i] !== null && (
        <div key={`student-${i}`} className={cx("studentInput")}>
          <div className={cx("nameInput")}>
            <InputField
              type="text"
              label="Nom de famille"
              prependIcon="badge"
              value={students[i].lastName}
              setValue={(newValue) => {
                setStudents((prev) => {
                  const copy = [...prev];
                  copy[i].lastName = newValue;
                  return copy;
                });
              }}
              isRequired
            />
            <InputField
              type="text"
              label="Prénom"
              prependIcon="face"
              value={students[i].firstName}
              setValue={(newValue) => {
                setStudents((prev) => {
                  const copy = [...prev];
                  copy[i].firstName = newValue;
                  return copy;
                });
              }}
              isRequired
            />
            <Button
              type="icon"
              iconName="delete"
              className={cn(cx("deleteButton"), "red--text")}
              onClick={() => {
                handleRemoveStudent(i);
              }}
              size="small"
              noKeyboardFocus
            />
          </div>
        </div>
      )
  );

  return (
    <Card className={cx("addStudentsCard")}>
      <Form
        onSubmit={() =>
          submitAction(
            `/teacher/${teacherEmail}/group/${groupId}/admin/add-students`,
            "PUT",
            students
          )
        }
      >
        <CardHeader title={<h2>Ajouter des élèves</h2>} centerTitle />
        <CardContent>
          <>{studentsTemplate}</>
          <Button
            type="icon"
            iconName="add"
            className={cn("red darken-1", cx("addStudentBtn"))}
            onClick={handleAddStudent}
          />
          <p>Nombre d&rsquo;élèves : {nbStudents}</p>
        </CardContent>

        <CardActions>
          <Spacer />
          <Button
            className="red--text mr-3"
            type="outlined"
            onClick={() => {
              closeASDialog();
              setTimeout(resetForm, 300); // Don't show layout shift
            }}
          >
            Annuler
          </Button>
          <Button type="elevated" className="blue darken-3" isLoading={isLoading} formSubmit>
            Valider
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}
