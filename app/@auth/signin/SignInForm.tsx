"use client";

import { useEffect, useCallback, useState, ChangeEventHandler } from "react";
import Link from "next/link";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import Icon from "@/components/Icon";
import cn from "classnames/bind";
import signInFormStyles from "./SignInForm.module.scss";
import { useAuthAction } from "../useAuthAction";

const cx = cn.bind(signInFormStyles);

export default function SignInForm() {
  const { isLoading, submitAction } = useAuthAction();

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
    <Card className={cx("signInCard")}>
      <Form onSubmit={() => submitAction("/api/signin", { ...user, accountType })}>
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
            type="elevated"
            className="blue darken-3"
            isDisabled={!isValid}
            title={buttonTitle}
            isLoading={isLoading}
            trailingIcon="send"
            formSubmit
          >
            Valider
          </Button>
        </CardActions>
      </Form>
    </Card>
  );
}
