import { CSSProperties, memo } from "react";
import Image from "next/legacy/image";
import avatarStyles from "./Avatar.module.scss";
import cn from "classnames";

interface CommonAvatarProps {
  borderColour?: string;
  size?: number;
  className?: string;
}

interface ImageProps extends CommonAvatarProps {
  type: "image-avatar";
  src: string;
}

interface TextProps extends CommonAvatarProps {
  type: "initials-avatar";
  initials: string;
  bgColour?: string;
}

type AvatarProps = ImageProps | TextProps;

function Avatar(props: AvatarProps) {
  let avatarTemplate;
  let style: CSSProperties & {
    "--border-colour"?: string;
    "--avatar-bg"?: string;
    "--size"?: string;
  } = {};
  if (props.borderColour) style["--border-colour"] = props.borderColour;
  style["--size"] = props.size ? props.size + "px" : "50px";

  const initialsAvatarBgColour = (() => {
    if (!("src" in props)) {
      if (props.bgColour) {
        return props.bgColour;
      } else {
        return "#" + Math.floor(Math.random() * 0xffffff).toString(16);
      }
    }
  })();

  if ("src" in props) {
    // The next/image component can't be the direct child of a flex container
    // Hence, wrap it with a div
    avatarTemplate = (
      <div>
        <Image
          src={props.src}
          alt="Avatar"
          className={cn(avatarStyles.avatar, {
            [avatarStyles.borderAround]: props.borderColour,
          })}
          width={props.size ? props.size : 50}
          height={props.size ? props.size : 50}
          layout="responsive"
        />
      </div>
    );
  } else {
    style["--avatar-bg"] = initialsAvatarBgColour;
    avatarTemplate = <div className={avatarStyles.initials}>{props.initials}</div>;
  }

  return (
    <div className={cn(avatarStyles.avatarContainer, props.className)} style={style}>
      {avatarTemplate}
    </div>
  );
}

export default memo(Avatar);
