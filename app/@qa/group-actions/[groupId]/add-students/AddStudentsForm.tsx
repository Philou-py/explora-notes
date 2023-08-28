"use client";

import { useState } from "react";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import Icon from "@/components/Icon";
import cn from "classnames/bind";
import createGroupFormStyles from "./CreateGroupForm.module.scss";

const cx = cn.bind(createGroupFormStyles);

export default function AddStudents() {
  const { isAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const { currentBreakpoint: cbp } = useContext(BreakpointsContext);
  const { teacherId, groupMap, evaluationMap } = useContext(TeacherContext);
  const { confirmModalTemplate, promptConfirmation } = useConfirmation();
  const { subjects } = useGetSubject();

  const [modalOpen, setModalOpen] = useState(false);
  const {
    data: newGroup,
    setData,
    isValid,
    register,
  } = useForm({ name: "", level: "", subject: "" });
  const [students, setStudents] = useState<[string, string, string][]>([["", "", ""]]);

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <CardHeader title={<h2>{isEditing ? "Modifier" : "Ajouter"} un groupe</h2>} centerTitle />
        <CardContent>
          <fieldset className={cx("generalInfo")}>
            <legend>Informations générales</legend>
            <InputField
              type="text"
              label="Nom du groupe"
              prependIcon="face"
              isRequired
              maxLength={10}
              {...register("name")}
            />
            <InputField
              type="select"
              label="Matière"
              prependIcon="subject"
              selectItems={subjects}
              isRequired
              {...register("subject")}
            />
            <InputField
              type="select"
              label="Niveau"
              prependIcon="school"
              selectItems={levelsForSelect}
              isRequired
              {...register("level")}
            />
          </fieldset>

          <fieldset className={cx("studentDetails")}>
            <legend>Élèves</legend>
            <>{studentsTemplate}</>
            <div className={cx("addIconContainer")}>
              <Button
                type="icon"
                iconName="add"
                className="red darken-1"
                onClick={handleAddStudent}
              />
            </div>
            <p>
              Nombre d&rsquo;élèves : {actualNbStudents} | Année scolaire : {schoolYear}
            </p>
          </fieldset>
        </CardContent>

        <CardActions>
          <Spacer />
          <Button className="red--text mr-4" type="outlined" onClick={handleModalClose}>
            Annuler
          </Button>
          <Button
            className="blue darken-3"
            isDisabled={!isAuthenticated || !isValid || studentsFilled.includes(false) || isLoading}
            formSubmit
          >
            {isLoading ? "Chargement..." : "Valider"}
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}
