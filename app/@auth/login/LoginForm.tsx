import { useEffect, useCallback, useState, ChangeEventHandler } from "react";
import Link from "next/link";
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
  Icon,
} from "@/components";
import cn from "classnames/bind";
import loginFormStyles from "./LoginForm.module.scss";
import { useAuthAction } from "../useAuthAction";

const cx = cn.bind(loginFormStyles);

export default function LoginForm() {
  const [isLoading] = useState(false);
  const { submitAction } = useAuthAction();

  const [accountType, setAccountType] = useState<"student" | "teacher">("student");
  const {
    data: user,
    isValid,
    register,
  } = useForm({
    email: "",
    password: "",
  });

  const buttonTitle = !isValid ? "Le formulaire n'est pas valide !" : undefined;

  const onRadioSelected: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setAccountType(e.target.value as "student" | "teacher");
  }, []);

  // Fix for a React bug: https://github.com/vercel/next.js/issues/49499
  useEffect(() => {
    (
      document.querySelector(`[type=radio][name=account_type][value=student]`) as HTMLInputElement
    ).checked = true;
  }, []);

  return (
    <Card cssWidth="clamp(300px, 40%, 600px)">
      <Form onSubmit={() => submitAction("/api/login", { ...user, accountType })}>
        <CardHeader title={<h3>Connexion</h3>} centerTitle />
        <CardContent>
          <div className={cx("accountType")}>
            <div className={cx("label")}>
              <Icon iconName="badge" className={cx("icon")} />
              Type de compte :
            </div>
            <div className={cx("radioGroup")}>
              <input
                type="radio"
                name="account_type"
                id="student"
                value="student"
                checked={accountType === "student"}
                onChange={onRadioSelected}
              />
              <label htmlFor="student">Étudiant</label>
              <input
                type="radio"
                name="account_type"
                id="teacher"
                value="teacher"
                checked={accountType === "teacher"}
                onChange={onRadioSelected}
              />
              <label htmlFor="teacher">Professeur</label>
            </div>
          </div>
          <InputField
            type="email"
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
            {...register("password")}
          />
        </CardContent>
        <CardActions>
          <Link href="/signup" replace>
            Pas de compte ?
          </Link>
          <Spacer />
          <Button
            className="blue darken-3"
            isDisabled={!isValid || isLoading}
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
