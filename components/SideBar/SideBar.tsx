import Link from "next/link";
import { cookies } from "next/headers";
import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";
import Avatar from "@/components/Avatar";
import SignOutButton from "@/app/@auth/SignOutButton";
import { verify } from "jsonwebtoken";
import { dgraphQuery } from "@/app/dgraphQuery";
import { readFileSync } from "fs";

let cx = cn.bind(sideBarStyles);

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
        groups {
          id
        }
      }
    }
  `;
  const user = await dgraphQuery(GET_USER, { email }, "getUser");
  if (!user) return null;
  return user;
}

interface SideBarProps {}

export default async function SideBar({}: SideBarProps) {
  const currentUser = await getCurrentUser();
  const navLinks = [];
  const isAuthenticated = false;

  return (
    <div className={cx("content")}>
      {!isAuthenticated && (
        <Link href="/" style={{ textDecoration: "none" }}>
          <h3 className={sideBarStyles.title}>ExploraNotes</h3>
        </Link>
      )}
      {isAuthenticated && (
        <>
          <SignOutButton />
          <Avatar
            type="initials-avatar"
            className={sideBarStyles.avatar}
            initials="MB"
            // initials={currentUser!.username
            //   .split(" ")
            //   .map((part) => part[0].toUpperCase())
            //   .join("")}
            borderColour="#33c9ff"
            size={150}
          />
        </>
      )}

      <nav className={sideBarStyles.navList}>
        {navLinks.map(([name, url]) => (
          <Link href={url} key={name}>
            {name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
