"use client";

import { ReactElement, useState, useEffect } from "react";
import Dialog from "../Dialog";
import ShowQuickActionsModalProvider from "./ShowQuickActionsModalContext";

interface ModalProps {
  children: ReactElement;
}

export default function QuickActionsModal({ children }: ModalProps) {
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);

  useEffect(() => {
    setShowQuickActionsModal(true);
  }, [setShowQuickActionsModal]);

  return (
    <ShowQuickActionsModalProvider
      showQuickActionsModal={showQuickActionsModal}
      setShowQuickActionsModal={setShowQuickActionsModal}
    >
      <Dialog showDialog={showQuickActionsModal}>{children}</Dialog>
    </ShowQuickActionsModalProvider>
  );
}
