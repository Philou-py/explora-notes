import { createContext } from "react";

export const ShowModalContext = createContext({
  showModal: false,
  setShowModal: (_: boolean) => {},
});

export default function ShowModalProvider({ showModal, setShowModal, children }) {
  return (
    <ShowModalContext.Provider value={{ showModal, setShowModal }}>
      {children}
    </ShowModalContext.Provider>
  );
}
