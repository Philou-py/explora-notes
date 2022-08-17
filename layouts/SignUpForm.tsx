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
    file: "",
  });

  const buttonTitle = !isFormValid ? "Le formulaire n'est pas valide !" : undefined;

  const uploadImage = useCallback(async () => {
    const BASE_FILE_URL =
      window.location.hostname === "toccatech.fr"
        ? "http://file-server.toccatech.fr"
        : "https://file-server.toccatech.com";

    const formData = new FormData();
    formData.append("file", newUser.file);
    formData.append("isPublic", "true");
    formData.append("sharedWith", "[]");
    formData.append("resource", "userAvatars");
    try {
      const response = await fetch(BASE_FILE_URL + "/files/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const { fileId, error } = await response.json();
      if (error) {
        console.log(error);
      } else {
        const newURL = `${BASE_FILE_URL}/files/${fileId}`;
        return newURL;
      }
    } catch (error) {
      console.log(error);
      haveASnack("error", <h6>Oh non, le serveur de fichiers est inaccessible !</h6>);
    }
  }, [newUser.file, haveASnack]);

  const handleSubmit = useCallback(async () => {
    console.log("Inscription...");
    const SIGN_UP_URL =
      window.location.hostname === "toccatech.fr"
        ? "http://auth-server.toccatech.fr/signup"
        : "https://auth-server.toccatech.com/signup";

    let avatarURL = "";
    if (newUser.file) {
      let result = await uploadImage();
      if (result) avatarURL = result;
    }
    try {
      const response = await fetch(SIGN_UP_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.pwd,
          username: newUser.username,
          avatarURL,
        }),
      });
      const result = await response.json();
      if (response.status == 400) {
        console.log("Erreur de validation !");
        haveASnack("error", <h6>Données saisies invalides !</h6>);
      } else if (response.status == 406) {
        console.log("Le nom choisi est déjà utilisé par un autre utilisateur !");
        haveASnack("error", <h6>Le nom choisi est déjà utilisé par un autre utilisateur !</h6>);
      } else if (response.status == 500) {
        console.log("Erreur serveur !");
        haveASnack("error", <h6>Oh non, une erreur non identifiée est survenue !</h6>);
      } else if (response.status == 201) {
        console.log("Succès !");
        haveASnack("success", <h6>Bienvenue, {result.user.username} !</h6>);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        if (onCompleted) onCompleted();
      }
      console.log(result);
    } catch (error) {
      console.log(error);
      haveASnack("error", <h6>Oh non, le serveur d&rsquo;authentification est inaccessible !</h6>);
    }
  }, [uploadImage, newUser, haveASnack, setCurrentUser, setIsAuthenticated, onCompleted]);

  return (
    <Card cssWidth={alreadyAnAccountFunc ? "clamp(300px, 40%, 600px)" : ""} className={className}>
      <CardHeader title={<h3>Inscription</h3>} centerTitle />
      <CardContent>
        <Form>
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
          <InputField
            type="file"
            label="Télécharger votre avatar"
            prependIcon="image"
            acceptTypes="image/*"
            fullWidth
            {...register("file", newUser.file)}
          />
        </Form>
      </CardContent>
      <CardActions>
        {alreadyAnAccountFunc && <a onClick={alreadyAnAccountFunc}>Déjà un compte ?</a>}
        <Spacer />
        <Button
          className="blue darken-3"
          isDisabled={!isFormValid || isLoading}
          title={buttonTitle}
          onClick={handleSubmit}
        >
          {isLoading ? "Chargement..." : "Valider"}
        </Button>
      </CardActions>
    </Card>
  );
}

export default memo(SignUpForm);
