import QuickActionsModal from "@/components/QuickActionsModal";
import CreateGroupForm from "./CreateGroupForm";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";

const publicKey = readFileSync("public.key");

function getTeacherEmail() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) notFound();

  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object" || payload.accountType === "student") notFound();

  return payload.email;
}

export default function CreateGroup() {
  const teacherEmail = getTeacherEmail();

  return (
    <QuickActionsModal>
      <CreateGroupForm teacherEmail={teacherEmail} />
    </QuickActionsModal>
  );
}
