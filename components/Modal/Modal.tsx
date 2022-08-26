import { ReactElement, useCallback, MouseEvent, useRef, cloneElement } from "react";
import modalStyles from "./Modal.module.scss";
import cn from "classnames";

interface ModalProps {
  showModal: boolean;
  children: ReactElement;
  closeFunc?: (isOpen: boolean) => void;
}

export default function Modal({ showModal = false, closeFunc, children: child }: ModalProps) {
  const modalBgRef = useRef(null);

  const handleBgClick = useCallback(
    (event: MouseEvent) => {
      if (closeFunc && (event.target as HTMLDivElement).isSameNode(modalBgRef.current)) {
        closeFunc(false);
      }
    },
    [closeFunc]
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
