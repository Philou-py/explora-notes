import snackBarStyles from "./SnackBar.module.scss";
import { ReactElement } from "react";
import cn from "classnames";

interface SnackBarProps {
  children: ReactElement;
  showSnackBar: boolean;
  snackBarType: "success" | "error" | "info";
}

export default function SnackBar({ children, showSnackBar, snackBarType }: SnackBarProps) {
  return (
    <div className={cn(snackBarStyles.snackBarWrapper, { [snackBarStyles.show]: showSnackBar })}>
      <div
        className={cn(snackBarStyles.snackBar, {
          green: snackBarType == "success",
          blue: snackBarType == "info",
          red: snackBarType == "error",
        })}
      >
        {children}
      </div>
    </div>
  );
}
