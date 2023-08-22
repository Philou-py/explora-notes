"use client";

import { ReactNode, createContext, useState, useEffect } from "react";

interface ProviderProps {
  children: ReactNode;
  breakpointsList: { [Property: string]: number };
}

export const BreakpointsContext = createContext<{
  breakpoints: Record<string, boolean>;
  currentBreakpoint: string;
}>({
  breakpoints: {},
  currentBreakpoint: "lg",
});

export default function BreakpointsProvider({ children, breakpointsList }: ProviderProps) {
  const [breakpoints, setBreakpoints] = useState<Record<string, boolean>>({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("lg");

  useEffect(() => {
    const matches: Record<string, boolean> = {};
    const mediaQueryLists: MediaQueryList[] = [];
    const changeEventHandlers: ((event: MediaQueryListEvent) => void)[] = [];

    let prevBrpt = "";
    for (let breakpoint in breakpointsList) {
      const minWidth = prevBrpt ? `(min-width: ${breakpointsList[prevBrpt]}px)` : "";
      const maxWidth =
        breakpointsList[breakpoint] === Infinity
          ? ""
          : `(max-width: ${breakpointsList[breakpoint]}px)`;
      let queryString = minWidth + (minWidth && maxWidth ? " and " + maxWidth : maxWidth);
      const queryList = matchMedia(queryString);
      mediaQueryLists.push(queryList);

      const handleChange = (event: MediaQueryListEvent) => {
        console.log("Screen changed!");
        matches[breakpoint] = event.matches;
        setBreakpoints({ ...matches });
        if (event.matches) setCurrentBreakpoint(breakpoint);
      };
      changeEventHandlers.push(handleChange);

      matches[breakpoint] = queryList.matches;
      queryList.addEventListener("change", handleChange);
      setBreakpoints(matches);
      if (queryList.matches) setCurrentBreakpoint(breakpoint);
      prevBrpt = breakpoint;
    }
    return () => {
      for (let i = 0; i < mediaQueryLists.length; i++) {
        mediaQueryLists[i].removeEventListener("change", changeEventHandlers[i]);
      }
    };
  }, [breakpointsList]);

  return (
    <BreakpointsContext.Provider value={{ breakpoints, currentBreakpoint }}>
      {children}
    </BreakpointsContext.Provider>
  );
}
