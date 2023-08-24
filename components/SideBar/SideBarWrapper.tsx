"use client";

import { MouseEventHandler, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { SideBarContext } from "@/contexts/SideBarContext";
import sideBarStyles from "./SideBar.module.scss";
import cn from "classnames/bind";

let cx = cn.bind(sideBarStyles);

interface SideBarWrapperProps {
  children: ReactNode;
}

export default function SideBarWrapper({ children }: SideBarWrapperProps) {
  const { sideBarOpen, clippedSideBar, setSideBarOpen } = useContext(SideBarContext);
  const [smScreen, setSmScreen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 960px)");
    mql.addEventListener("change", (event) => {
      setSmScreen(event.matches);
    });
  }, []);

  const isSideBarClipped = clippedSideBar && !smScreen;

  const handleSideBarClose: MouseEventHandler<HTMLDivElement> = (event) => {
    if ((event.target as HTMLDivElement).isSameNode(wrapperRef.current)) {
      setSideBarOpen(false);
    }
  };

  const wrapperRef = useRef(null);

  return (
    <div
      className={cx("wrapper", { show: sideBarOpen, clippedSideBar: isSideBarClipped })}
      ref={wrapperRef}
      onClick={handleSideBarClose}
    >
      {children}
    </div>
  );
}
