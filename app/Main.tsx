"use client";

import { ReactNode, useContext } from "react";
import { SideBarContext } from "@/contexts/SideBarContext";
import cn from "classnames/bind";
import mainStyles from "./Main.module.scss";

const cx = cn.bind(mainStyles);

export default function Main({ children }: { children: ReactNode }) {
  const { clippedSideBar, sideBarOpen } = useContext(SideBarContext);

  return (
    <main className={cx("main", { shiftContent: clippedSideBar && sideBarOpen })}>{children}</main>
  );
}
