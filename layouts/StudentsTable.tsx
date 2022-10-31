import { useContext, useMemo, memo } from "react";
import { useRouter } from "next/router";
import { TeacherContext } from "../contexts/TeacherContext";
import { DataTable, TableHeader } from "../components";
import { roundNum } from "../helpers/roundNum";

function StudentsTable() {
  const router = useRouter();
  const { groupId } = router.query as { groupId: string };
  const { groupMap } = useContext(TeacherContext);
  const students = useMemo(
    () => (groupMap[groupId] !== undefined ? Object.values(groupMap[groupId].studentMap) : []),
    [groupMap, groupId]
  );

  const studentsTableHeaders = useMemo<TableHeader[]>(
    () => [
      { text: "Nom de famille", value: "lastName" },
      { text: "Prénom", value: "firstName" },
      {
        text: "Moyenne dans cette matière",
        value: "subjectAverageOutOf20",
        alignContent: "center",
      },
    ],
    []
  );

  const hasConflicts = useMemo(() => {
    if (groupMap[groupId]) {
      const allStatistics = groupMap[groupId].evalStatistics;
      return Object.values(allStatistics).some((stat) => stat.scaleConflicts);
    }
    return false;
  }, [groupMap, groupId]);

  const studentsTableItems = useMemo(
    () =>
      students.map((student) => ({
        key: { rawContent: student.id },
        lastName: { rawContent: student.lastName },
        firstName: { rawContent: student.firstName },
        subjectAverageOutOf20: {
          rawContent:
            student.subjectAverageOutOf20 !== undefined && !hasConflicts
              ? student.subjectAverageOutOf20
              : "",
          content: hasConflicts
            ? "Modif barèmes en cours..."
            : student.subjectAverageOutOf20 !== undefined
            ? roundNum(student.subjectAverageOutOf20, 2)
            : "Pas encore de notes !",
        },
      })),
    [students, hasConflicts]
  );

  return (
    <DataTable
      headers={studentsTableHeaders}
      items={studentsTableItems}
      sortBy="lastName"
      lineNumbering
    />
  );
}

export default memo(StudentsTable);
