// import { useState, useContext, useCallback } from "react";
import Image from "next/legacy/image";
import Link from "next/link";
import { cookies } from "next/headers";
import nBStyles from "./NavBar.module.scss";
import cn from "classnames";
import Container from "../Container";
import Avatar from "../Avatar";
import SideBar from "../SideBar";
import SideBarTrigger from "./SideBarTrigger";
import exploraNotesLogo from "@/public/images/logo.png";
import { dgraphQuery } from "@/app/dgraphQuery";
import { verify } from "jsonwebtoken";
import { readFileSync } from "fs";
import SignOutButton from "@/app/@auth/signOutButton";

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
  hasClippedSideBar?: boolean;
}

export default async function NavBar({
  centerNavSmScreens = true,
  fixed = true,
  flat,
  hasClippedSideBar,
}: NavBarProps) {
  const currentUser = await getCurrentUser();

  const navLinks = [
    ["Évaluations", "/evaluations"],
    ["Groupes", "/groups"],
    [...(!!currentUser ? ["Déconnexion", "/api/signout"] : ["Connexion", "/login"])],
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
      <div
        className={cn(nBStyles.navBar, {
          [nBStyles.flat]: flat,
          [nBStyles.fixed]: fixed,
        })}
      >
        <Container className={nBStyles.navBarContainer}>
          <div
            className={cn(nBStyles.presentation, {
              [nBStyles.centerNavSmScreens]: centerNavSmScreens,
            })}
          >
            <SideBarTrigger hasClippedSideBar={hasClippedSideBar}>
              <SideBar navLinks={navLinks} handleAuth />
            </SideBarTrigger>
            <Link href="/" className={cn(nBStyles.logoAndTitle)}>
              <div className={nBStyles.logoContainer}>
                <Image src={exploraNotesLogo} alt="Logo" width={50} height={50} />
              </div>
              <h4 className={nBStyles.title}>ExploraNotes</h4>
            </Link>
          </div>
          {navMenu}
          {!!currentUser && (
            <div className={cn(nBStyles.avatarContainer)}>
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
