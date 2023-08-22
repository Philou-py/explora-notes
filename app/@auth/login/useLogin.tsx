import { useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { SnackContext } from "@/contexts/SnackContext";

interface NewUser {
  accountType: "teacher" | "student";
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function useSignUp() {
  const { haveASnack } = useContext(SnackContext);
  const router = useRouter();

  const signUp = useCallback(
    async (newUser: NewUser) => {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      haveASnack(result.status, <h6>{result.msg}</h6>);

      router.refresh();
    },
    [haveASnack, router]
  );

  return { signUp };
}
