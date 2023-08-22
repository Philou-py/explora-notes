"use client";

import LoginForm from "./LoginForm";
import Modal from "@/components/Modal";

export default function Login() {
  return (
    <Modal goBackOnClose={true}>
      <LoginForm />
    </Modal>
  );
}
