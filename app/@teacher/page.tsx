import teacherDashStyles from "./teacherDashStyles.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(teacherDashStyles);

export default function TeacherDashboard() {
  return (
    <div className={cx("dashboard")}>
      <h1>Teacher Dashboard</h1>
      <div></div>
    </div>
  );
}
