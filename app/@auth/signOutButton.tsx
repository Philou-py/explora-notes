"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/Button";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      onClick={async () => {
        const response = await fetch("/api/signout");
        console.log(await response.json());
        router.refresh();
        router.push("/");
      }}
    >
      Déconnexion
    </Button>
  );
}
