export default function CreateEvalForm() {
  return <p>Hello</p>;
}

// "use client";
//
// import { useState, useCallback } from "react";
// import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
// import Form, { useForm } from "@/components/Form";
// import InputField from "@/components/InputField";
// import Button from "@/components/Button";
// import Spacer from "@/components/Spacer";
// import cn from "classnames/bind";
// import createGroupFormStyles from "./CreateGroupForm.module.scss";
// import { useHandleMutation } from "@/app/useHandleMutation";
//
// const cx = cn.bind(createGroupFormStyles);
//
// export default function CreateEvalForm({ closeDialog }) {
//   const {
//     data: newEval,
//     setData: setNewEval,
//     isValid,
//     register,
//   } = useForm({ title: "", markPrecision: "0.5", coefficient: "1" });
//
//   const [nbCriteria, setNbCriteria] = useState(1);
//
//   const [scale, setScale] = useState();
//
//   const resetForm = useCallback(() => {
//     setNewEval({ title: "", markPrecision: "0.5", coefficient: "1" });
//     setNbCriteria(1);
//   }, [setNewEval]);
//
//   const { submitAction, isLoading } = useHandleMutation(closeDialog, resetForm);
//
//   return (
//     <Card className={cx("createEvalCard")}>
//       <Form
//         onSubmit={() => submitAction(`/teacher/group/${groupId}/create-eval`, "POST", newGroup)}
//       >
//         <CardHeader title={<h2>Créer une évaluation</h2>} centerTitle />
//         <CardContent>
//           <fieldset className={cx("generalInfo")}>
//             <legend>Informations générales</legend>
//             <InputField
//               type="text"
//               label="Titre de l&rsquo;évaluation"
//               prependIcon="title"
//               isRequired
//               {...register("title")}
//             />
//             <InputField
//               type="select"
//               label="Intervalle de notation"
//               prependIcon="precision_manufacturing"
//               selectItems={precisionsForSelect}
//               isRequired
//               isDisabled={isEditing && !detailedEditing}
//               {...register("markPrecision")}
//             />
//             <InputField
//               type="select"
//               label="Coefficient de la note ramenée sur 20"
//               prependIcon="weight"
//               selectItems={coefficientForSelect}
//               isRequired
//               {...register("coefficient")}
//             />
//             <p>Les notes des copies seront ramenées sur 20 points.</p>
//           </fieldset>
//
//           <fieldset className={cx("scale")}>
//             <legend>Barème</legend>
//             {scaleTemplate}
//             {(!isEditing || detailedEditing) && (
//               <>
//                 <div className={cx("addIconContainer")}>
//                   <Button
//                     type="icon"
//                     iconName="remove"
//                     className="yellow darken-1 mr-4"
//                     onClick={handleRemoveQuestion}
//                     size="small"
//                   />
//                   <Button
//                     type="icon"
//                     iconName="add"
//                     className="red darken-1"
//                     onClick={handleAddQuestion}
//                   />
//                 </div>
//                 <div className={cx("addExerciseContainer")}>
//                   <Button
//                     type="outlined"
//                     prependIcon="add_box"
//                     className="green--text"
//                     onClick={handleAddExercise}
//                   >
//                     Exercice
//                   </Button>
//                 </div>
//               </>
//             )}
//             <p>
//               Nombre de questions : {nbQuestions} | Total des points : {totalPoints}
//             </p>
//           </fieldset>
//         </CardContent>
//         <CardActions>
//           <Spacer />
//           <Button className="red--text mr-3" type="outlined" onClick={closeDialog}>
//             Annuler
//           </Button>
//           <Button
//             type="elevated"
//             className="blue darken-3"
//             isDisabled={!isValid}
//             isLoading={isLoading}
//             formSubmit
//           >
//             Valider
//           </Button>
//         </CardActions>
//       </Form>
//     </Card>
//   );
// }
