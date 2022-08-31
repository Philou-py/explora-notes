import { useCallback, useMemo } from "react";

export const useGetSubject = () => {
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

  return { subjects, getSubject };
};
