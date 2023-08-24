"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/Button";

export default function SignOutButton({ className = "" }) {
  const router = useRouter();

  return (
    <Button
      className={className}
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
