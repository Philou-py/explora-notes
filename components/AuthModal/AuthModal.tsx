"use client";

import { ReactElement, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dialog from "../Dialog";
import ShowAuthModalProvider from "./ShowAuthModalContext";

interface ModalProps {
  children: ReactElement;
}

export default function AuthModal({ children }: ModalProps) {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setShowAuthModal(true);
  }, [setShowAuthModal]);

  const handleDialogClose = useCallback(() => {
    setShowAuthModal(false);
    setTimeout(() => router.back(), 300);
  }, [router]);

  return (
    <ShowAuthModalProvider showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal}>
      <Dialog showDialog={showAuthModal} closeFunc={handleDialogClose}>
        {children}
      </Dialog>
    </ShowAuthModalProvider>
  );
}
