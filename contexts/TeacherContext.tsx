import {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  ReactNode,
} from "react";
import { AuthContext } from "./AuthContext";
import { db } from "../firebase-config";
import { collection, where, onSnapshot, query, orderBy } from "firebase/firestore";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  subjectAverageOutOf20?: number;
  subjectWeightTotal: number;
  subjectPointsSum: number;
}

export interface Group {
  id: string;
  teacher: string;
  schoolYear: string;
  name: string;
  nbStudents: number;
  subject: string;
  actualSubject: string;
  level: string;
  shortenedLevel: string;
  shortenedSchoolYear: string;
  studentIds: string[];
  studentMap: {
    [id: string]: Student;
  };
  evalStatistics: {
    [id: string]: {
      average: number;
      averageOutOf20: number;
      totalPoints: number;
      copyNb: number;
      minMark: number;
      minMarkOutOf20: number;
      maxMark: number;
      maxMarkOutOf20: number;
      exerciseAverages: number[];
      exerciseTotalPoints: number[];
    };
  };
}

export interface Copy {
  id: string;
  mark: number;
  pointsObtained: number[];
  markOutOf20: number;
  pointsByEx: number[];
  bonusPoints: number;
  penaltyPoints: number;
  studentId: string;
  evaluationId: string;
  groupId: string;
}

export interface Evaluation {
  id: string;
  creationDate: string;
  title: string;
  totalPoints: number;
  nbQuestions: number;
  scale: number[];
  exercises: number[];
  exerciseScale: number[];
  markPrecision: number;
  coefficient: number;
  associatedGroupIds: string[];
  copies: {
    [gId: string]: {
      [sId: string]: Copy;
    };
  };
}

interface TeacherContext {
  teacherId: string;
  groupMap: {
    [id: string]: Group;
  };
  evaluationMap: {
    [id: string]: Evaluation;
  };
}

export const TeacherContext = createContext<TeacherContext>({
  teacherId: "",
  groupMap: {},
  evaluationMap: {},
});

interface TeacherProviderProps {
  children: ReactNode;
}

export default function TeacherProvider({ children }: TeacherProviderProps) {
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const teacherId = currentUser ? currentUser.id : "";

  const [groupMap, setGroupMap] = useState<{ [id: string]: Group }>({});
  const [evaluationMap, setEvaluationMap] = useState<{ [id: string]: Evaluation }>({});

  // const teachersGroups = useMemo(() => Object.keys(groupMap), [groupMap]);
  // const teachersEvaluations = useMemo(() => Object.keys(evaluationMap), [evaluationMap]);

  const subjects = useMemo(
    () => [
      ["Physique-chimie", "physics"],
      ["ES Physique-chimie", "st-physics"],
      ["Mathématiques", "maths"],
      ["NSI", "it"],
      ["Français", "french"],
      ["Anglais", "english"],
      ["Allemand", "german"],
      ["Italien", "italian"],
      ["Espagnol", "spanish"],
      ["EPS", "sport"],
      ["SES", "economics"],
      ["SVT", "biology"],
      ["ES SVT", "st-biology"],
      ["Histoire-géo", "history-geography"],
      ["Art-plastique", "arts"],
    ],
    []
  );

  const levels = useMemo(
    () => [
      ["6ème", "Sixième"],
      ["5ème", "Cinquième"],
      ["4ème", "Quatrième"],
      ["3ème", "Troisième"],
      ["2nde", "Seconde"],
      ["1ère", "Première"],
      ["Term", "Terminale"],
      ["BCPST 1", "BCPST 1"],
      ["BCPST 2", "BCPST 2"],
      ["MPSI", "MPSI"],
      ["MP", "MP"],
      ["PSI", "PSI"],
      ["PCSI", "PCSI"],
      ["PC", "PC"],
    ],
    []
  );

  const getSubject = useCallback(
    (sub: string) => {
      for (let i = 0; i < subjects.length; i++) {
        if (subjects[i][1] === sub) {
          return subjects[i][0];
        }
      }
      return "";
    },
    [subjects]
  );

  const shortenLevel = useCallback(
    (lev: string) => {
      for (let i = 0; i < levels.length; i++) {
        if (levels[i][1] === lev) {
          return levels[i][0];
        }
      }
    },
    [levels]
  );

  const shortenYear = useCallback((year: string) => {
    const y1 = year.slice(2, 4);
    const y2 = year.slice(7, 9);
    return `${y1}-${y2}`;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const qGroups = query(
        collection(db, "groups"),
        where("teacher", "==", teacherId),
        where("isDeleted", "!=", true),
        orderBy("isDeleted", "asc"),
        orderBy("schoolYear", "desc")
      );
      return onSnapshot(qGroups, (querySnapshot) => {
        const groups = {};
        querySnapshot.forEach((groupRef) => {
          const groupData = groupRef.data();
          groups[groupRef.id] = {
            id: groupRef.id,
            actualSubject: getSubject(groupData.subject),
            shortenedLevel: shortenLevel(groupData.level),
            shortenedSchoolYear: shortenYear(groupData.schoolYear),
            ...groupData,
          };
        });
        setGroupMap(groups);
      });
    } else {
      setGroupMap({});
    }
  }, [isAuthenticated, teacherId, getSubject, shortenLevel, shortenYear]);

  useEffect(() => {
    if (isAuthenticated) {
      const qEvals = query(collection(db, "evaluations"), where("creator", "==", teacherId));
      return onSnapshot(qEvals, (querySnapshot) => {
        const evals = {};
        querySnapshot.forEach((evalRef) => {
          const evalData = evalRef.data();
          evals[evalRef.id] = { id: evalRef.id, ...evalData };
        });
        setEvaluationMap(evals);
      });
    } else {
      setEvaluationMap({});
    }
  }, [isAuthenticated, teacherId]);

  //   useEffect(() => {
  //     if (isAuthenticated && teachersGroups.length !== 0 && teachersEvaluations.length !== 0) {
  //       const qCopies = query(collection(db, "copies"), where("groupId", "in", teachersGroups));
  //       return onSnapshot(qCopies, (querySnapshot) => {
  //         const copies = {};
  //         teachersGroups.forEach((group) => {
  //           copies[group] = {};
  //           teachersEvaluations.forEach((evaluation) => {
  //             copies[group][evaluation] = {};
  //           });
  //         });
  //         querySnapshot.forEach((copyRef) => {
  //           const copyData = copyRef.data();
  //           copies[copyData.groupId][copyData.evaluationId][copyData.studentId] = {
  //             id: copyRef.id,
  //             ...copyData,
  //           };
  //         });
  //         setCopyMap(copies);
  //       });
  //     } else {
  //       setCopyMap({});
  //     }
  //   }, [isAuthenticated, teacherId, teachersGroups, teachersEvaluations]);

  return (
    <TeacherContext.Provider value={{ teacherId, groupMap, evaluationMap }}>
      {children}
    </TeacherContext.Provider>
  );
}
