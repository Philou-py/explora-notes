import Link from "next/link";
import { memo, MouseEvent } from "react";
import buttonStyles from "./Button.module.scss";
import cn from "classnames";
import { Icon } from "..";

interface ButtonProps {
  isFlat?: boolean;
  type?: "raised" | "outlined" | "icon" | "text";
  formSubmit?: boolean;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  isLink?: boolean;
  href?: string;
  title?: string;
  size?: "small" | "large" | "x-large";
  iconName?: string;
  prependIcon?: string;
  trailingIcon?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  noKeyboardFocus?: boolean;
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
  circle.classList.add(buttonStyles.ripple, "ripple"); // Don't forget the class 'ripple' for the colours!
  element.appendChild(circle);
  // Remove circle after animation
  setTimeout(() => {
    element.removeChild(circle);
  }, 800);
}

function Button(props: ButtonProps) {
  const makeIconTemplate = (iconName: string, type: string) => (
    <Icon iconName={iconName} className={buttonStyles[type]} />
  );

  const childrenWithIcons = (
    <>
      {props.prependIcon && makeIconTemplate(props.prependIcon, "prependIcon")}
      {props.children}
      {props.trailingIcon && makeIconTemplate(props.trailingIcon, "trailingIcon")}
    </>
  );

  const buttonContent =
    props.type === "icon" ? makeIconTemplate(props.iconName!, "normal") : childrenWithIcons;

  const buttonClassNames = cn(
    buttonStyles.btn,
    buttonStyles.rippleContainer,
    "btn", // For the colours
    {
      [buttonStyles.icon]: props.type === "icon",
      [buttonStyles.textButton]: props.type === "text",
      [buttonStyles.outlined]: props.type === "outlined",
      [buttonStyles.flat]: props.isFlat || props.type === "outlined",
      [buttonStyles.disabled]: props.isDisabled,
      [buttonStyles.fullWidth]: props.isFullWidth,
      [buttonStyles[props.size!]]: props.size,
      [props.className!]: props.className && !props.isDisabled,
    }
  );

  return props.isLink ? (
    !props.isDisabled ? (
      <Link href={props.href!}>
        <a className={buttonClassNames} title={props.title} onMouseDown={createRipple}>
          {buttonContent}
        </a>
      </Link>
    ) : (
      <a className={buttonClassNames} title={props.title} tabIndex={props.noKeyboardFocus ? -1 : 0}>
        {buttonContent}
      </a>
    )
  ) : (
    <button
      type={props.formSubmit ? "submit" : "button"}
      onClick={props.onClick}
      className={buttonClassNames}
      disabled={props.isDisabled}
      title={props.title}
      onMouseDown={createRipple}
      tabIndex={props.noKeyboardFocus ? -1 : 0}
    >
      {buttonContent}
    </button>
  );
}

export default memo(Button);
