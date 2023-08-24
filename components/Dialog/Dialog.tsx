// Why not "use client"?
// https://github.com/vercel/next.js/discussions/46795

import { ReactElement, useCallback, useRef, MouseEventHandler } from "react";
import dialogStyles from "./Dialog.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(dialogStyles);

interface DialogProps {
  showDialog: boolean;
  children: ReactElement;
  closeFunc?: (isOpen: boolean) => void;
}

export default function Dialog({ showDialog, closeFunc, children }: DialogProps) {
  const modalBgRef = useRef(null);
  const handleBgClick: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (closeFunc && (event.target as HTMLDivElement).isSameNode(modalBgRef.current)) {
        closeFunc(false);
      }
    },
    [closeFunc]
  );

  return (
    <div className={cx("bg", { show: showDialog })} onClick={handleBgClick} ref={modalBgRef}>
      {children}
    </div>
  );
}
