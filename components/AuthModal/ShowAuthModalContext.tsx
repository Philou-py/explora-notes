"use client";

import { createContext } from "react";

export const ShowAuthModalContext = createContext({
  showAuthModal: false,
  setShowAuthModal: (_: boolean) => {},
});

export default function ShowAuthModalProvider({ showAuthModal, setShowAuthModal, children }) {
  return (
    <ShowAuthModalContext.Provider value={{ showAuthModal, setShowAuthModal }}>
      {children}
    </ShowAuthModalContext.Provider>
  );
}
