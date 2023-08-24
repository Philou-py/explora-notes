"use client";

import { ReactElement, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dialog from "../Dialog";
import ShowModalProvider from "./ShowModalContext";

interface ModalProps {
  children: ReactElement;
}

export default function Modal({ children }: ModalProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, [setShowModal]);

  const handleDialogClose = useCallback(() => {
    setShowModal(false);
    setTimeout(() => router.back(), 300);
  }, [router]);

  return (
    <ShowModalProvider showModal={showModal} setShowModal={setShowModal}>
      <Dialog showDialog={showModal} closeFunc={handleDialogClose}>
        {children}
      </Dialog>
    </ShowModalProvider>
  );
}
