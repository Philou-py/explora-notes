import { ReactNode } from "react";
import containerStyles from "./Container.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(containerStyles);

interface ContainerProps {
  large?: boolean;
  narrow?: boolean;
  xNarrow?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function Container({ large, narrow, xNarrow, children, className }: ContainerProps) {
  return (
    <div className={cn(className, cx("container", { large, narrow, xNarrow }))}>{children}</div>
  );
}
