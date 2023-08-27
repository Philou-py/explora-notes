"use client";

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import signInButtonStyles from "./SignInButton.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(signInButtonStyles);

export default function SignInButton() {
  const [smScreen, setSmScreen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 960px)");
    setSmScreen(mql.matches); // Test initially
    mql.addEventListener("change", (event) => {
      setSmScreen(event.matches);
    });
  }, []);

  return smScreen ? (
    <Button
      type="icon"
      iconName="login"
      className={cn("white--text", cx("signInButton"))}
      href="/signin"
      isLink
    />
  ) : (
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
