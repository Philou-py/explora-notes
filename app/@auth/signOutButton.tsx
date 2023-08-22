"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/Button";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      onClick={async () => {
        await fetch("/api/signout");
        router.refresh();
        router.push("/");
      }}
    >
      Déconnexion
    </Button>
  );
}
