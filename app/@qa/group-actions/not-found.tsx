import Link from "next/link";
import notFoundStyles from "./not-found.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(notFoundStyles);

export default function NotFound() {
  return (
    <div className={cx("notFound")}>
      <h1>Erreur 404</h1>
      <h2>
        Attention ! Vous n&rsquo;êtes pas connecté(e), ou bien vous possédez un compte élève !
      </h2>
      <h2>
        Essayez de vous <Link href="/signin">(re-)connecter</Link> !
      </h2>
    </div>
  );
}
