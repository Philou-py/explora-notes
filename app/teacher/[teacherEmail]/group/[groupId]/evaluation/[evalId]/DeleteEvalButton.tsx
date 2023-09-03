"use client";

import { useCallback, useContext, useState } from "react";
import Button from "@/components/Button";
import { SnackContext } from "@/contexts/SnackContext";
import { useParams, useRouter } from "next/navigation";

function useHandleDeletion(teacherEmail: string) {
  const { haveASnack } = useContext(SnackContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const submitDeletion = useCallback(
    async (url: string, method: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(url, { method: method });
        const result = await response.json();
        haveASnack(result.status, <h6>{result.msg}</h6>);
        if (result.status === "success") {
          router.refresh();
          router.push(`/teacher/${teacherEmail}`);
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        haveASnack("error", <h6>Oh non, une erreur réseau est survenue !</h6>);
        setIsLoading(false);
      }
    },
    [haveASnack, setIsLoading, router, teacherEmail]
  );
  return { isLoading, submitDeletion };
}

export default function DeleteEvalButton() {
  const { teacherEmail, groupId, evalId } = useParams();
  const { submitDeletion, isLoading } = useHandleDeletion(teacherEmail as string);

  return (
    <Button
      type="filled"
      className="deep-purple darken-2"
      prependIcon="delete"
      onClick={() =>
        submitDeletion(
          `/teacher/${teacherEmail}/group/${groupId}/evaluation/${evalId}/delete-eval`,
          "DELETE"
        )
      }
      isLoading={isLoading}
    >
      Supprimer
    </Button>
  );
}
