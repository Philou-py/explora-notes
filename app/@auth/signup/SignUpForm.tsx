"use client";

import { useEffect, useCallback, useState, ChangeEventHandler } from "react";
import Link from "next/link";
import Card, { CardHeader, CardContent, CardActions } from "@/components/Card";
import Form, { useForm } from "@/components/Form";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Spacer from "@/components/Spacer";
import Icon from "@/components/Icon";
import { useAuthAction } from "../useAuthAction";
import signUpFormStyles from "./SignUpForm.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(signUpFormStyles);

export default function SignUpForm() {
  const { isLoading, submitAction } = useAuthAction();

  const [accountType, setAccountType] = useState<"student" | "teacher">("student");
  const {
    data: newUser,
    isValid: isFormValid,
    register,
  } = useForm({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const buttonTitle = !isFormValid ? "Le formulaire n'est pas valide !" : undefined;

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
    <Card cssWidth={"clamp(300px, 40%, 600px)"}>
      <Form onSubmit={() => submitAction("/api/signup", { ...newUser, accountType })}>
        <CardHeader title={<h3>Inscription</h3>} centerTitle />
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
          <div className={cx("additionalFields", { show: accountType === "student" })}>
            <InputField
              type="text"
              label="Nom d&rsquo;utilisateur"
              prependIcon="face"
              isRequired={accountType === "student"}
              fullWidth
              {...register("username")}
            />
          </div>
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
            {...register("password")}
          />
          <div className={cx("additionalFields", { show: accountType === "teacher" })}>
            <InputField
              type="text"
              label="Prénom (visible par les élèves)"
              prependIcon="face"
              isRequired={accountType === "teacher"}
              fullWidth
              {...register("firstName")}
            />
            <InputField
              type="text"
              label="Nom de famille (visible par les élèves)"
              prependIcon="face"
              isRequired={accountType === "teacher"}
              fullWidth
              {...register("lastName")}
            />
          </div>
        </CardContent>
        <CardActions>
          <Link href="/signin" replace>
            Déjà un compte ?
          </Link>
          <Spacer />
          <Button
            className="blue darken-3"
            isDisabled={!isFormValid}
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
