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

interface ConnexionFormProps {
  noAccountFunc?: () => void;
  onCompleted?: () => void;
  className?: string;
}

function ConnexionForm({ noAccountFunc, onCompleted, className }: ConnexionFormProps) {
  const { setCurrentUser, setIsAuthenticated } = useContext(AuthContext);
  const { haveASnack } = useContext(SnackContext);
  const [isLoading] = useState(false);

  const {
    data: user,
    isValid,
    register,
  } = useForm({
    username: "",
    pwd: "",
  });

  const buttonTitle = !isValid ? "Le formulaire n'est pas valide !" : undefined;

  const handleSubmit = useCallback(async () => {
    console.log("Connection...");
    const SIGN_IN_URL =
      window.location.hostname === "toccatech.fr"
        ? "http://auth-server.toccatech.fr/signin"
        : "https://auth-server.toccatech.com/signin";

    try {
      const response = await fetch(SIGN_IN_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          password: user.pwd,
        }),
      });
      const result = await response.json();
      if (response.status == 400) {
        console.log("Erreur de validation !");
        haveASnack("error", <h6>Données saisies invalides !</h6>);
      } else if (response.status == 404) {
        console.log("Nom d'utilisateur inconnu !");
        haveASnack("error", <h6>Nom d&rsquo;utilisateur inconnu !</h6>);
      } else if (response.status == 403) {
        console.log("Mot de passe incorrect !");
        haveASnack("error", <h6>Mot de passe incorrect !</h6>);
      } else if (response.status == 500) {
        console.log("Erreur serveur !");
        haveASnack("error", <h6>Oh non, une erreur non identifiée est survenue !</h6>);
      } else if (response.status == 200) {
        console.log("Succès !");
        haveASnack("success", <h6>Content de vous revoir, {result.user.username} !</h6>);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        if (onCompleted) onCompleted();
      }
      console.log(result);
    } catch (error) {
      console.log(error);
      haveASnack("error", <h6>Oh non, le serveur d&rsquo;authentification est inaccessible !</h6>);
    }
  }, [user, haveASnack, setCurrentUser, setIsAuthenticated, onCompleted]);

  return (
    <Card cssWidth={noAccountFunc ? "clamp(300px, 40%, 600px)" : ""} className={className}>
      <CardHeader title={<h3>Connexion</h3>} centerTitle />
      <CardContent>
        <Form>
          <InputField
            type="text"
            label="Nom d&rsquo;utilisateur"
            prependIcon="account_circle"
            fullWidth
            isRequired
            {...register("username")}
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
        </Form>
      </CardContent>
      <CardActions>
        {noAccountFunc && <a onClick={noAccountFunc}>Pas de compte ?</a>}
        <Spacer />
        <Button
          className="blue darken-3"
          isDisabled={!isValid || isLoading}
          title={buttonTitle}
          onClick={handleSubmit}
        >
          {isLoading ? "Chargement..." : "Valider"}
        </Button>
      </CardActions>
    </Card>
  );
}

export default memo(ConnexionForm);
