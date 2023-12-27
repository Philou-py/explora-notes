"use client";

import { useCallback, useContext, useState } from "react";
import publishEvalStyles from "./PublishEvalButton.module.scss";
import cn from "classnames/bind";
import Button from "@/components/Button";
import { SnackContext } from "@/contexts/SnackContext";
import { useParams, useRouter } from "next/navigation";

const cx = cn.bind(publishEvalStyles);

function useHandlePublish() {
  const { haveASnack } = useContext(SnackContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { teacherEmail, groupId, evalId } = useParams();

  const submitExport = useCallback(
    async (isPublished: boolean) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/teacher/${teacherEmail}/group/${groupId}/evaluation/${evalId}/manage`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublished }),
          }
        );
        const result = await response.json();
        haveASnack(result.status, <h6>{result.msg}</h6>);
        if (result.status === "success") {
          router.refresh();
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        haveASnack("error", <h6>Oh non, une erreur réseau est survenue !</h6>);
        setIsLoading(false);
      }
    },
    [haveASnack, setIsLoading, router, evalId, groupId, teacherEmail]
  );
  return { isLoading, submitExport };
}

export default function PublishEvalButton({ isPublished }) {
  const { submitExport, isLoading } = useHandlePublish();

  return (
    <Button
      type="filled"
      className={cn("red darken-2", cx("publishButton"))}
      prependIcon={isPublished ? "lock" : "lock_open"}
      isLoading={isLoading}
      onClick={() => submitExport(!isPublished)}
    >
      {isPublished ? "Rendre privé" : "Publier"}
    </Button>
  );
}
