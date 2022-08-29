import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { useMarksTable } from "../../../hooks/useFetchGroup";
import {
  Container,
  Button,
  Modal,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Form,
} from "../../../components";

export default function EvalForGroupDetails() {
  const router = useRouter();
  const { evalId } = router.query as { evalId: string };
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState("");

  const addCopy = useCallback((studentId: string) => {}, []);

  const deleteCopy = useCallback((studentId: string) => {}, []);

  const prefillForm = useCallback((studentId: string) => {}, []);

  const addCopySubmit = useCallback(() => {}, []);

  const { group, marksTableTemplate } = useMarksTable(addCopy, deleteCopy, prefillForm);

  return (
    <Container>
      <h1 className="pageTitle text-center">Détails de l&rsquo;évaluation pour un groupe</h1>
      {marksTableTemplate}

      <Modal showModal={showAddCopyModal}>
        <Card cssWidth="clamp(50px, 500px, 95%)">
          <Form onSubmit={addCopySubmit}>
            <CardHeader title={<h2>Ajouter une copie</h2>} centerTitle />
            <CardContent>
              <p>Élève concerné : {"currentEvalToBind.name"}</p>
            </CardContent>
          </Form>
        </Card>
      </Modal>
    </Container>
  );
}
