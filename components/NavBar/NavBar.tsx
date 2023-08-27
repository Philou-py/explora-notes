import Image from "next/legacy/image";
import Link from "next/link";
import { cookies } from "next/headers";
import nBStyles from "./NavBar.module.scss";
import cn from "classnames/bind";
import Container from "../Container";
import Avatar from "../Avatar";
import SignInButton from "@/app/@auth/signin/SignInButton";
import SideBarTrigger from "./SideBarTrigger";
import exploraNotesLogo from "@/public/images/logo.png";
import { dgraphQuery } from "@/app/dgraphQuery";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";

const cx = cn.bind(nBStyles);

const publicKey = readFileSync("public.key");

async function getCurrentUser() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("X-ExploraNotes-Auth");
  if (!jwt) return null;
  const payload = verify(jwt.value, publicKey, { algorithms: ["RS256"] });
  if (typeof payload !== "object") return null;

  const { email, accountType: aT } = payload;
  const GET_USER = `
    query GetUser($email: String!) {
      getUser: ${aT === "student" ? "getStudent" : "getTeacher"}(email: $email) {
        email
        displayName: ${aT === "student" ? "username" : "fullName"}
      }
    }
`;
  const user = await dgraphQuery(GET_USER, { email }, "getUser");
  if (!user) return null;
  return user;
}

interface NavBarProps {
  fixed?: boolean;
  flat?: boolean;
}

export default async function NavBar({ fixed = true, flat = false }: NavBarProps) {
  const currentUser = await getCurrentUser();

  return (
    <>
      <div className={cx("navBar", { flat, fixed })}>
        <Container className={cx("navBarContainer")}>
          {currentUser && <SideBarTrigger />}
          <Link href="/" className={cx("logoAndTitle")}>
            <Image src={exploraNotesLogo} alt="Logo" width={50} height={50} />
            <h4 className={nBStyles.title}>ExploraNotes</h4>
          </Link>
          {!currentUser && <SignInButton />}
          {currentUser && (
            <Avatar
              type="initials-avatar"
              className={cx("avatar")}
              initials={currentUser.displayName
                .split(" ")
                .map((part: string) => part[0].toUpperCase())
                .join("")}
              borderColour="#33c9ff"
              size={50}
            />
          )}
        </Container>
      </div>
    </>
  );
}
