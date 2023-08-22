// import { useState, useContext, useCallback } from "react";
import Image from "next/legacy/image";
import Link from "next/link";
import { cookies } from "next/headers";
import nBStyles from "./NavBar.module.scss";
import cn from "classnames/bind";
import Container from "../Container";
import Avatar from "../Avatar";
import SideBarTrigger from "./SideBarTrigger";
import exploraNotesLogo from "@/public/images/logo.png";
import { dgraphQuery } from "@/app/dgraphQuery";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import SignOutButton from "@/app/@auth/signOutButton";

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
  centerNavSmScreens?: boolean;
  onNavIconClick?: () => void;
  fixed?: boolean;
  flat?: boolean;
}

export default async function NavBar({
  centerNavSmScreens = true,
  fixed = true,
  flat,
}: NavBarProps) {
  const currentUser = await getCurrentUser();

  const navLinks = [
    ["Évaluations", "/evaluations"],
    ["Groupes", "/groups"],
    [...(!!currentUser ? ["Déconnexion", "/api/signout"] : ["Connexion", "/signin"])],
  ] as [string, string][];

  const navMenu = (
    <nav className={nBStyles.navMenu}>
      {navLinks.map(([name, url]) => (
        <Link href={url} key={name}>
          {name}
        </Link>
      ))}
      <SignOutButton />
    </nav>
  );

  return (
    <>
      <div className={cx("navBar", { flat, fixed })}>
        <Container className={cx("navBarContainer")}>
          <SideBarTrigger />
          <Link href="/" className={cx("logoAndTitle", { centerNavSmScreens })}>
            <Image src={exploraNotesLogo} alt="Logo" width={50} height={50} />
            <h4 className={nBStyles.title}>ExploraNotes</h4>
          </Link>
          {navMenu}
          {!!currentUser && (
            <div className={cx("avatarContainer")}>
              <Avatar
                type="initials-avatar"
                initials={currentUser.displayName
                  .split(" ")
                  .map((part: string) => part[0].toUpperCase())
                  .join("")}
                borderColour="#33c9ff"
                size={50}
              />
            </div>
          )}
        </Container>
      </div>
    </>
  );
}
