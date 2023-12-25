import Image from "next/legacy/image";
import Link from "next/link";
import nBStyles from "./NavBar.module.scss";
import cn from "classnames/bind";
import Container from "../Container";
import Avatar from "../Avatar";
import SignInButton from "@/app/@auth/signin/SignInButton";
import SideBarTrigger from "./SideBarTrigger";
import exploraNotesLogo from "@/public/images/logo.png";

const cx = cn.bind(nBStyles);

interface NavBarProps {
  fixed?: boolean;
  flat?: boolean;
  accountType?: string;
  currentUser?: {
    email: string;
    displayName: string;
  };
}

export default async function NavBar({
  fixed = true,
  flat = false,
  accountType,
  currentUser,
}: NavBarProps) {
  return (
    <div className={cn(cx("navBar", { flat, fixed }), "noprint")}>
      <Container className={cx("navBarContainer")}>
        {currentUser && <SideBarTrigger />}
        <Link
          href={accountType ? `/${accountType}/${currentUser.email}` : "/"}
          className={cx("logoAndTitle")}
        >
          <Image src={exploraNotesLogo} alt="Logo" width={50} height={50} />
          <h4 className={nBStyles.title}>ExploraNotes</h4>
        </Link>
        {!currentUser && <SignInButton />}
        {currentUser && (
          <Avatar
            type="initials-avatar"
            className={cx("avatar")}
            initials={currentUser.displayName
              .split(" ")
              .map((part: string) => (part[0] ? part[0].toUpperCase() : ""))
              .join("")}
            borderColour="#33c9ff"
            size={50}
          />
        )}
      </Container>
    </div>
  );
}
