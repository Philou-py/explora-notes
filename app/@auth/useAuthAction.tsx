import { useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { SnackContext } from "@/contexts/SnackContext";
import { SideBarContext } from "@/contexts/SideBarContext";
import { ShowModalContext } from "@/components/Modal";

export function useAuthAction() {
  const { haveASnack } = useContext(SnackContext);
  const { setShowModal } = useContext(ShowModalContext);
  const { setSideBarOpen } = useContext(SideBarContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const submitAction = useCallback(
    async (url: string, reqBody: object) => {
      try {
        setIsLoading(true);
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
          setShowModal(false);
          setTimeout(() => {
            const mql = window.matchMedia("(max-width: 960px)");
            if (!mql.matches) setSideBarOpen(true);
            router.refresh();
            router.back();
          }, 200);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.log(error);
        haveASnack("error", <h6>Oh non, une erreur réseau est survenue !</h6>);
        setIsLoading(false);
      }
    },
    [haveASnack, setIsLoading, setSideBarOpen, router, setShowModal]
  );
  return { isLoading, submitAction };
}
