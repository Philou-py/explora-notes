import { useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { SnackContext } from "@/contexts/SnackContext";

export function useAuthAction() {
  const { haveASnack } = useContext(SnackContext);
  const router = useRouter();

  const submitAction = useCallback(
    async (url: string, reqBody: object) => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        });
        const result = await response.json();
        haveASnack(result.status, <h6>{result.msg}</h6>);
        if (result.status === "success") {
          router.refresh();
          router.back();
        }
      } catch (error) {
        console.log(error);
        haveASnack("error", <h6>Oh non, une erreur réseau est survenue !</h6>);
      }
    },
    [haveASnack, router]
  );

  return { submitAction };
}
