"use client";

import Button from "@/components/Button";
import signInButtonStyles from "./SignInButton.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(signInButtonStyles);

export default function SignInButton() {
  return (
    <Button
      prependIcon="login"
      href="/signin"
      type="outlined"
      className={cn("white--text", cx("signInButton"))}
      isLink
    >
      Connexion
    </Button>
  );
}
