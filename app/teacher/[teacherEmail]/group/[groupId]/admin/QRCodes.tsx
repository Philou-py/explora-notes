"use client";

import Button from "@/components/Button";
import QRCode from "qrcode";
import { useEffect, useState, useContext } from "react";
import cn from "classnames/bind";
import QRCodesStyle from "./QRCodes.module.scss";
import { useParams } from "next/navigation";
import { SnackContext } from "@/contexts/SnackContext";
import { GroupStudent } from "./get-signed-ids/route";

const cx = cn.bind(QRCodesStyle);

export default function QRCodes({ groupStudents }: { groupStudents: GroupStudent[] }) {
  const [show, setShow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { teacherEmail, groupId } = useParams();
  const { haveASnack } = useContext(SnackContext);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show) {
      async function getGroupStudents() {
        setIsLoading(true);
        const response = await fetch(
          `/teacher/${teacherEmail}/group/${groupId}/admin/get-signed-ids`,
          { cache: "no-cache" } // Don't cache, because of cookie check
        );
        const result = await response.json();
        if (result.status === "error") {
          haveASnack(result.status, <h6>{result.msg}</h6>);
        } else if (result.signedIDs.length === 0) {
          haveASnack("info", <h6>Aucun élève n&rsquo;est présent dans le groupe !</h6>);
        }
        return { signedIDs: result.signedIDs, groupStudents: result.groupStudents };
      }

      async function genQRCodes() {
        const { signedIDs } = await getGroupStudents();
        if (!signedIDs || signedIDs.length === 0) {
          setShow(false);
          setIsLoading(false);
          return;
        }

        groupStudents.forEach((grSt: GroupStudent, i: number) => {
          const canvas = document.querySelector(".qrcode-" + grSt.id);
          QRCode.toCanvas(canvas, signedIDs[i], { width: 250 }, (err) => {
            if (err) console.log("Error generating QR Code", err);
          });
          console.log("QR Code pour", grSt.firstName, signedIDs[i]);
        });
        setIsExpanded(true);
        setIsLoading(false);
      }
      genQRCodes();
    } else {
      setIsExpanded(false);
    }
  }, [show, groupId, haveASnack, teacherEmail, groupStudents]);

  return (
    <>
      <Button
        type="elevated"
        className="green darken-2 noprint"
        prependIcon="qr_code"
        onClick={() => setShow(!show)}
        style={{ margin: "30px auto" }}
        isLoading={isLoading}
      >
        Afficher les QR Codes
      </Button>
      <div className={cn(cx("studentQRs", { show: isExpanded }), "print")}>
        {groupStudents.map((grSt) => (
          <div key={grSt.id} className={cx("studentWithQR")}>
            <p>
              {grSt.lastName} {grSt.firstName}
            </p>
            <canvas className={"qrcode-" + grSt.id}></canvas>
          </div>
        ))}
      </div>
    </>
  );
}
