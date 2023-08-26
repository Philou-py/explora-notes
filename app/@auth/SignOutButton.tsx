"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { SideBarContext } from "@/contexts/SideBarContext";
import Button from "@/components/Button";

export default function SignOutButton() {
  const { setSideBarOpen } = useContext(SideBarContext);
  const router = useRouter();

  return (
    <Button
      className="primary--text"
      type="outlined"
      prependIcon="logout"
      onClick={async () => {
        setSideBarOpen(false);
        await fetch("/api/signout");
        router.refresh();
        router.push("/");
      }}
      isFullWidth
    >
      Déconnexion
    </Button>
  );
}
