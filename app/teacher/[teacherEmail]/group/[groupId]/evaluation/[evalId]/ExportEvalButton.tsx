"use client";

import { useCallback, useContext, useState } from "react";
import Button from "@/components/Button";
import { SnackContext } from "@/contexts/SnackContext";
import { useParams } from "next/navigation";

function useHandleExport(evalTitle: string) {
  const { haveASnack } = useContext(SnackContext);
  const [isLoading, setIsLoading] = useState(false);

  const submitExport = useCallback(
    async (url: string, method: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(url, { method: method });
        if (response.status !== 200) {
          const result = await response.json();
          haveASnack(result.status, <h6>{result.msg}</h6>);
        } else {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${evalTitle}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        haveASnack("error", <h6>Oh non, une erreur réseau est survenue !</h6>);
        setIsLoading(false);
      }
    },
    [haveASnack, setIsLoading, evalTitle]
  );
  return { isLoading, submitExport };
}

export default function ExportEvalButton({ evalTitle }) {
  const { teacherEmail, groupId, evalId } = useParams();
  const { submitExport, isLoading } = useHandleExport(evalTitle);

  return (
    <Button
      type="filled"
      className="blue darken-2"
      prependIcon="download"
      onClick={() =>
        submitExport(
          `/teacher/${teacherEmail}/group/${groupId}/evaluation/${evalId}/export-eval`,
          "GET"
        )
      }
      isLoading={isLoading}
    >
      Exporter
    </Button>
  );
}
