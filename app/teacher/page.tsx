import teacherDashStyles from "./teacherDashStyles.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(teacherDashStyles);

export default function TeacherDashboard() {
  console.log("Rendering...");
  return (
    <div className={cx("dashboard")}>
      <h1>Teacher Dashboard</h1>
    </div>
  );
}
