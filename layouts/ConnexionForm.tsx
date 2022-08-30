import { memo, useCallback, useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { SnackContext } from "../contexts/SnackContext";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Form,
  useForm,
  InputField,
  Button,
  Spacer,
} from "../components";
import { auth, db } from "../firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

interface ConnexionFormProps {
  noAccountFunc?: () => void;
  onCompleted?: () => void;
  className?: string;
}

// TODO: mot de passe oublié
// Erreur non identifiée quand on ne saisit pas une adresse email

function ConnexionForm({ noAccountFunc, onCompleted, className }: ConnexionFormProps) {
  const { setCurrentUser, setIsAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const [isLoading] = useState(false);

  const {
    data: user,
    isValid,
    register,
  } = useForm({
    email: "",
    pwd: "",
  });

  const buttonTitle = !isValid ? "Le formulaire n'est pas valide !" : undefined;

  const handleSubmit = useCallback(async () => {
    console.log("Signing in...");
    try {
      const userCredentials = await signInWithEmailAndPassword(auth, user.email, user.pwd);
      getDoc(doc(db, "users", userCredentials.user.email)).then((userDocSnap) => {
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log("Successfully logged in!");
          haveASnack("success", <h6>Content de vous revoir, {userData.username} !</h6>);
          setIsAuthenticated(true);
          setCurrentUser({
            id: userCredentials.user.uid,
            username: userData.username,
            email: user.email,
          });
          if (onCompleted) onCompleted();
        }
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log("Unknown email!");
        haveASnack("error", <h6>Cette adresse email est inconnue !</h6>);
      } else if (error.code === "auth/wrong-password") {
        haveASnack("error", <h6>Le mot de passe est incorrect !</h6>);
      } else {
        console.log("Firebase Error!", error.code, error.message);
        haveASnack("error", <h6>Oh non, une erreur non identifiée est survenue !</h6>);
      }
    }
  }, [user, haveASnack, setCurrentUser, setIsAuthenticated, onCompleted]);

  return (
    <Card cssWidth={noAccountFunc ? "clamp(300px, 40%, 600px)" : ""} className={className}>
      <Form onSubmit={handleSubmit}>
        <CardHeader title={<h3>Connexion</h3>} centerTitle />
        <CardContent>
          <InputField
            type="text"
            label="Adresse email"
            prependIcon="account_circle"
            fullWidth
            isRequired
            {...register("email")}
          />
          <InputField
            type="password"
            label="Mot de passe"
            prependIcon="lock"
            minLength={6}
            fullWidth
            isRequired
            {...register("pwd")}
          />
        </CardContent>
        <CardActions>
          {noAccountFunc && <a onClick={noAccountFunc}>Pas de compte ?</a>}
          <Spacer />
          <Button
            className="blue darken-3"
            isDisabled={!isValid || isLoading}
            title={buttonTitle}
            onClick={handleSubmit}
            formSubmit
          >
            {isLoading ? "Chargement..." : "Valider"}
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}

export default memo(ConnexionForm);
