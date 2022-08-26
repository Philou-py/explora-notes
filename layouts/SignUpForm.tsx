import { memo, useCallback, useContext, useState } from "react";
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
import { AuthContext } from "../contexts/AuthContext";
import { db, auth } from "../firebase-config";
import { setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface ConnexionFormProps {
  alreadyAnAccountFunc?: () => void;
  onCompleted?: () => void;
  className?: string;
}

function SignUpForm({ alreadyAnAccountFunc, onCompleted, className }: ConnexionFormProps) {
  const { setCurrentUser, setIsAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const [isLoading] = useState(false);

  const {
    data: newUser,
    isValid: isFormValid,
    register,
  } = useForm({
    username: "",
    email: "",
    pwd: "",
  });

  const buttonTitle = !isFormValid ? "Le formulaire n'est pas valide !" : undefined;

  const handleSubmit = useCallback(async () => {
    console.log("Signin up...");

    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.pwd
      );
      const user = userCredentials.user;
      console.log("Succès !", user);
      const firestoreUser = {
        username: newUser.username,
        email: user.email,
        accountType: "teacher",
      };
      await setDoc(doc(db, "users", user.email), firestoreUser);

      haveASnack("success", <h6>Bienvenue, {firestoreUser.username} !</h6>);
      setCurrentUser({ ...firestoreUser, id: user.uid });
      setIsAuthenticated(true);
      if (onCompleted) onCompleted();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log("Could not sign up: email already in use!");
        haveASnack("error", <h6>Cette adresse email est déjà utilisée !</h6>);
      } else {
        console.log("Unidentified Firebase error!", error);
        haveASnack("error", <h6>Oh non, une erreur non identifiée est survenue !</h6>);
      }
    }
  }, [newUser, haveASnack, setCurrentUser, onCompleted, setIsAuthenticated]);

  return (
    <Card cssWidth={alreadyAnAccountFunc ? "clamp(300px, 40%, 600px)" : ""} className={className}>
      <Form onSubmit={handleSubmit}>
        <CardHeader title={<h3>Inscription</h3>} centerTitle />
        <CardContent>
          <InputField
            type="text"
            label="Nom d&rsquo;utilisateur"
            prependIcon="face"
            isRequired
            fullWidth
            {...register("username")}
          />
          <InputField
            type="email"
            label="Adresse email"
            prependIcon="account_circle"
            placeholder="vous@domaine.tld"
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
          {alreadyAnAccountFunc && <a onClick={alreadyAnAccountFunc}>Déjà un compte ?</a>}
          <Spacer />
          <Button
            className="blue darken-3"
            isDisabled={!isFormValid || isLoading}
            title={buttonTitle}
            formSubmit
          >
            {isLoading ? "Chargement..." : "Valider"}
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}

export default memo(SignUpForm);
