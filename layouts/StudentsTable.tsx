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

  const studentsTableItems = useMemo(
    () =>
      students.map((student) => ({
        key: { rawContent: student.id },
        lastName: { rawContent: student.lastName },
        firstName: { rawContent: student.firstName },
        subjectAverageOutOf20: {
          rawContent:
            student.subjectAverageOutOf20 !== undefined ? student.subjectAverageOutOf20 : "",
          content:
            student.subjectAverageOutOf20 !== undefined
              ? roundNum(student.subjectAverageOutOf20, 2)
              : "Pas encore de notes !",
        },
      })),
    [students]
  );

  return <DataTable headers={studentsTableHeaders} items={studentsTableItems} sortBy="lastName" />;
}

export default memo(StudentsTable);
