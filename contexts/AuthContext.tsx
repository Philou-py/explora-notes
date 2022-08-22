import {
  createContext,
  useState,
  ReactNode,
  SetStateAction,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { SnackContext } from "./SnackContext";
import { Modal } from "../components";
import ConnexionForm from "../layouts/ConnexionForm";
import SignUpForm from "../layouts/SignUpForm";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser, signOut as authSignOut } from "firebase/auth";

interface AuthProviderProps {
  children: ReactNode;
}

interface User {
  id: string;
  email: string;
  username: string;
}

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  currentUser?: User;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setCurrentUser: Dispatch<SetStateAction<User | undefined>>;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  signOut: () => void;
}>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  setCurrentUser: () => {},
  setModalOpen: () => {},
  signOut: () => {},
});

export default function AuthProvider({ children }: AuthProviderProps) {
  console.log("Auth provider rendered!");
  const { haveASnack } = useContext(SnackContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [showConnexion, setShowConnexion] = useState(true);

  const swapFormDisplay = useCallback(() => {
    setShowConnexion((oldValue) => !oldValue);
  }, []);

  const signOut = useCallback(async () => {
    console.log("Signing out...");
    try {
      await authSignOut(auth);
      console.log("User successfully signed out!");
      haveASnack("success", <h6>Vous êtes à présent déconnecté !</h6>);
      setIsAuthenticated(false);
      setCurrentUser(undefined);
    } catch (error) {
      console.log("An error occured when signing out!", error.code, error.message);
      haveASnack("error", <h6>Oh non, une erreur non identifiée est survenue !</h6>);
    }
  }, [haveASnack]);

  const onCompleted = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    const authObserver = (user: FirebaseUser) => {
      console.log("Auth observer ran!");
      if (user) {
        getDoc(doc(db, "users", user.uid)).then((userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsAuthenticated(true);
            setCurrentUser({
              id: user.uid,
              username: userData.username,
              email: user.email,
            });
          }
        });
      } else {
        setCurrentUser(undefined);
        setIsAuthenticated(false);
      }
      authUnsubscribe();
    };

    const authUnsubscribe = onAuthStateChanged(auth, authObserver);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        setIsAuthenticated,
        setCurrentUser,
        setModalOpen,
        signOut,
      }}
    >
      <Modal showModal={modalOpen} closeFunc={setModalOpen}>
        {showConnexion ? (
          <ConnexionForm noAccountFunc={swapFormDisplay} onCompleted={onCompleted} />
        ) : (
          <SignUpForm alreadyAnAccountFunc={swapFormDisplay} onCompleted={onCompleted} />
        )}
      </Modal>
      {children}
    </AuthContext.Provider>
  );
}
