import Link from "next/link";
import notFoundStyles from "./not-found.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(notFoundStyles);

export default function StudentNotFound() {
  return (
    <div className={cx("notFound")}>
      <h1>Erreur 404</h1>
      <h2>Cet élève n&rsquo;existe pas, ou bien vous n&rsquo;y avez pas accès !</h2>
      <h2>
        Revenez-donc sur <Link href="/">la page d&rsquo;accueil</Link> !
      </h2>
    </div>
  );
}
