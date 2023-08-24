"use client";

import { useCallback, useContext } from "react";
import nBStyles from "./NavBar.module.scss";
import cn from "classnames/bind";
import Button from "../Button";
import { SideBarContext } from "@/contexts/SideBarContext";

const cx = cn.bind(nBStyles);

export default function SideBarTrigger() {
  const { clippedSideBar, setSideBarOpen } = useContext(SideBarContext);
  const toggleSideBar = useCallback(() => {
    setSideBarOpen((prev) => !prev);
  }, [setSideBarOpen]);

  return (
    <Button
      className={cn(cx("navIconButton", { showAlways: clippedSideBar }), "white--text")}
      type="icon"
      iconName="menu"
      onClick={toggleSideBar}
      isFlat
    />
  );
}
