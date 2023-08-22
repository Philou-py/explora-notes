import SignInForm from "./SignInForm";
import Modal from "@/components/Modal";

export default function SignIn() {
  return (
    <Modal goBackOnClose={true}>
      <SignInForm />
    </Modal>
  );
}
