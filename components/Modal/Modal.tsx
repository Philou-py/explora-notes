"use client";

import { ReactElement, useCallback, useRef, cloneElement, MouseEventHandler } from "react";
import { useRouter } from "next/navigation";
import modalStyles from "./Modal.module.scss";
import cn from "classnames";

interface ModalProps {
  showModal?: boolean;
  children: ReactElement;
  goBackOnClose?: boolean;
  closeFunc?: (isOpen: boolean) => void;
}

export default function Modal({
  showModal = true,
  goBackOnClose = false,
  closeFunc,
  children: child,
}: ModalProps) {
  const modalBgRef = useRef(null);
  const router = useRouter();

  const handleBgClick: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if ((event.target as HTMLDivElement).isSameNode(modalBgRef.current)) {
        if (closeFunc) {
          closeFunc(false);
        } else if (goBackOnClose) {
          router.back();
        }
      }
    },
    [closeFunc, goBackOnClose, router]
  );

  return (
    <div
      className={cn(modalStyles.bg, { [modalStyles.show]: showModal })}
      onClick={handleBgClick}
      ref={modalBgRef}
    >
      {cloneElement(child, {
        className: cn(child.props.className, modalStyles.modal, {
          [modalStyles.show]: showModal,
        }),
      })}
    </div>
  );
}
