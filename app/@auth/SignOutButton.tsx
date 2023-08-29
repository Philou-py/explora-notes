"use client";

import { useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { SideBarContext } from "@/contexts/SideBarContext";
import { SnackContext } from "@/contexts/SnackContext";
import Button from "@/components/Button";

export default function SignOutButton() {
  const { haveASnack } = useContext(SnackContext);
  const { setSideBarOpen } = useContext(SideBarContext);
  const router = useRouter();

  const signOut = useCallback(async () => {
    setSideBarOpen(false);
    await fetch("/api/signout");
    router.refresh();
    router.push("/goodbye");
    haveASnack("info", <h6>Vous êtes à présent déconnecté(e) !</h6>);
  }, [router, setSideBarOpen, haveASnack]);

  return (
    <Button
      className="primary--text"
      type="outlined"
      prependIcon="logout"
      onClick={signOut}
      isFullWidth
    >
      Déconnexion
    </Button>
  );
}
