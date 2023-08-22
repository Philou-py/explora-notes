"use client";

import { useCallback, useContext, memo } from "react";
import Link from "next/link";
import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";
import { Button, Avatar } from "..";

interface SideBarProps {
  navLinks: [string, string][];
  handleAuth?: boolean;
}

let cx = cn.bind(sideBarStyles);

function SideBar({ navLinks, handleAuth }: SideBarProps) {
  const isAuthenticated = false;

  return (
    <div className={cx("content")}>
      {!isAuthenticated && (
        <Link href="/" style={{ textDecoration: "none" }}>
          <h3 className={sideBarStyles.title}>ExploraNotes</h3>
        </Link>
      )}
      {isAuthenticated && (
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

export default memo(SideBar);
