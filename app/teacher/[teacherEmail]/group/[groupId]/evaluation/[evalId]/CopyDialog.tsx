"use client";

import CopyForm from "./CopyForm";
import { Scale } from "./StudentMarksTable";
import { useCallback, useContext, useEffect, useState } from "react";
import { ActionContext } from "./ActionContext";
import Dialog from "@/components/Dialog";

export interface Copy {
  id: string;
  totalPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  shouldObserve: boolean;
  categoryResults: {
    id: string;
    points: number;
    comment: string;
    category: { id: string };
    criterionResults: {
      id: string;
      points: number;
      criterion: { id: string };
    }[];
  }[];
}

interface Props {
  scale: Scale;
  criteriaToObserve: string[];
}

const emptyCopy = {
  id: "",
  totalPoints: 0,
  bonusPoints: 0,
  penaltyPoints: 0,
  categoryResults: [],
  shouldObserve: false,
};

export default function CopyDialog({ scale, criteriaToObserve }: Props) {
  const { action, resetAction } = useContext(ActionContext);
  const [actionType, setActionType] = useState("");
  const [copy, setCopy] = useState(emptyCopy);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [show, setShow] = useState(false);
  const closeDialog = useCallback(() => {
    resetAction();
    setShow(false);
  }, [resetAction]);

  useEffect(() => {
    async function getCopy(copyId: string) {
      let copy: Copy;
      if (copyId) {
        const response = await fetch(`/teacher/copy/${copyId}`);
        copy = (await response.json()).copy;
      } else {
        copy = {
          ...emptyCopy,
          categoryResults: scale.categories.map((cat) => ({
            id: cat.id,
            points: 0,
            comment: "",
            category: { id: cat.id },
            criterionResults: cat.criteria.map((crit) => ({
              id: crit.id,
              points: -2,
              criterion: { id: crit.id },
            })),
          })),
        };
      }
      copy.categoryResults.sort(
        (a, b) =>
          scale.categories.findIndex((cat) => cat.id === a.category.id) -
          scale.categories.findIndex((cat) => cat.id === b.category.id)
      );
      copy.categoryResults.forEach((catRes, catIndex) => {
        catRes.criterionResults.sort(
          (a, b) =>
            scale.categories[catIndex].criteria.findIndex((crit) => crit.id === a.criterion.id) -
            scale.categories[catIndex].criteria.findIndex((crit) => crit.id === b.criterion.id)
        );
      });
      setCopy(copy);
      setStudentId(action.info.studentId);
      setStudentName(action.info.studentName);
      setActionType(action.type);
      setShow(true);
    }
    if (action.type) {
      getCopy(action.info.copyId);
    }
  }, [action, scale]);

  return (
    <Dialog showDialog={show}>
      <CopyForm
        studentId={studentId}
        studentName={studentName}
        copy={copy}
        scale={scale}
        criteriaToObserve={criteriaToObserve}
        actionType={actionType}
        closeDialog={closeDialog}
      />
    </Dialog>
  );
}
