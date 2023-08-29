"use client";

import Link from "next/link";
import { memo, MouseEvent, CSSProperties, ReactNode } from "react";
import buttonStyles from "./Button.module.scss";
import cn from "classnames/bind";
import Icon from "../Icon";

const cx = cn.bind(buttonStyles);

interface ButtonProps {
  type: "elevated" | "filled" | "outlined" | "icon" | "text" | "fab";
  formSubmit?: boolean;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  isLink?: boolean;
  href?: string;
  title?: string;
  size?: "small" | "normal" | "large" | "x-large";
  iconName?: string;
  prependIcon?: string;
  trailingIcon?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  noKeyboardFocus?: boolean;
  justifyContent?: CSSProperties["justifyContent"];
  makeCustomIcon?: (
    iconName: string,
    type: "prependIcon" | "trailingIcon" | "mainIcon"
  ) => ReactNode;
  style?: CSSProperties;
  children?: string;
}

function createRipple(event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
  const element = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${
    event.pageX - element.getBoundingClientRect().left - radius - window.pageXOffset
  }px`;
  circle.style.top = `${
    event.pageY - element.getBoundingClientRect().top - radius - window.pageYOffset
  }px`;
  circle.classList.add(cx("ripple"), "ripple"); // Don't forget the class 'ripple' for the colours!
  element.appendChild(circle);
  // Remove circle after animation (causes an uninteractive frequency)
  // setTimeout(() => {
  //   element.removeChild(circle);
  // }, 800);
}

function Button(props: ButtonProps) {
  const makeIconTemplate =
    props.makeCustomIcon ||
    ((iconName: string, type: string) => <Icon iconName={iconName} className={cx(type)} />);

  const childrenWithIcons = (
    <>
      {props.prependIcon && makeIconTemplate(props.prependIcon, "prependIcon")}
      <span>{props.children}</span>
      {props.trailingIcon && makeIconTemplate(props.trailingIcon, "trailingIcon")}
    </>
  );

  const buttonContent =
    props.type === "icon" ? makeIconTemplate(props.iconName, "mainIcon") : childrenWithIcons;

  const buttonClassNames = cn(
    "btn", // For the colours
    { [props.className!]: props.className && !props.isDisabled },
    cx("btn", "rippleContainer", props.type + "Btn", {
      disabled: props.isDisabled,
      fullWidth: props.isFullWidth,
      isLoading: props.isLoading,
      [props.size]: props.size && props.size !== "normal",
    })
  );

  const buttonStyle: object = {
    "--justify-content": props.justifyContent || "center",
    ...props.style,
  };

  return props.isLink ? (
    !props.isDisabled ? (
      <Link
        href={props.href!}
        className={buttonClassNames}
        title={props.title}
        onMouseDown={createRipple}
        style={buttonStyle}
      >
        {buttonContent}
      </Link>
    ) : (
      <a
        className={buttonClassNames}
        title={props.title}
        tabIndex={props.noKeyboardFocus ? -1 : 0}
        style={buttonStyle}
      >
        {buttonContent}
      </a>
    )
  ) : (
    <button
      type={props.formSubmit ? "submit" : "button"}
      onClick={props.onClick}
      className={buttonClassNames}
      disabled={props.isDisabled || props.isLoading}
      title={props.title}
      onMouseDown={createRipple}
      tabIndex={props.noKeyboardFocus ? -1 : 0}
      style={buttonStyle}
    >
      {buttonContent}
    </button>
  );
}

export default memo(Button);
