"use client";

import Button from "@/components/Button";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import cn from "classnames/bind";
import QRCodesStyle from "./QRCodes.module.scss";

const cx = cn.bind(QRCodesStyle);

export default function QRCodes({
  groupStudents,
  signedIDs,
}: {
  groupStudents: any[];
  signedIDs: string[];
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) {
      groupStudents.forEach((grSt, i) => {
        const canvas = document.querySelector(".qrcode-" + grSt.id);
        QRCode.toCanvas(canvas, signedIDs[i], { width: 250 }, (err) => {
          if (err) console.log("Error generating QR Code", err);
        });
        console.log("QR Code pour", grSt.firstName, signedIDs[i]);
      });
    }
  }, [show, signedIDs, groupStudents]);

  return (
    <>
      <Button
        type="elevated"
        className="green darken-2 noprint"
        prependIcon="qr_code"
        onClick={() => setShow(!show)}
        style={{ margin: "30px auto" }}
      >
        Afficher les QR Codes
      </Button>
      {show && (
        <div className={cn(cx("studentQRs"), "print")}>
          {groupStudents.map((grSt) => (
            <div key={grSt.id} className={cx("studentWithQR")}>
              <p>
                {grSt.lastName} {grSt.firstName}
              </p>
              <canvas className={"qrcode-" + grSt.id}></canvas>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
