import { useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { SnackContext } from "@/contexts/SnackContext";

export function useHandleMutation(closeDialog?: () => void, resetForm?: () => void) {
  const { haveASnack } = useContext(SnackContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const submitAction = useCallback(
    async (url: string, method: string, reqBody: object) => {
      try {
        setIsLoading(true);
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        });
        const result = await response.json();
        haveASnack(result.status, <h6>{result.msg}</h6>);
        if (result.status === "success") {
          if (closeDialog) closeDialog();
          setTimeout(() => {
            setIsLoading(false);
            if (resetForm) resetForm();
          }, 300); // Avoid layout shift
          router.refresh();
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.log(error);
        haveASnack("error", <h6>Oh non, une erreur réseau est survenue !</h6>);
        setIsLoading(false);
      }
    },
    [haveASnack, setIsLoading, closeDialog, router, resetForm]
  );
  return { isLoading, submitAction };
}
