"use client";

import SignUpForm from "./SignUpForm";
import Modal from "@/components/Modal";

export default function SignUp() {
  return (
    <Modal goBackOnClose={true}>
      <SignUpForm />
    </Modal>
  );
}
