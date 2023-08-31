import { dgraphQuery } from "@/app/dgraphQuery";
import CopyForm from "./CopyForm";
import { Scale } from "./StudentMarksTable";

export interface Copy {
  totalPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  categoryResults: {
    id: string;
    points: number;
    comment: string;
    category: { id: string };
    criterionResults: {
      id: string;
      points: number;
      criterion: { id: string };
    }[];
  }[];
}

const GET_COPY = `
  query($copyId: ID!) {
    getCopy(id: $copyId) {
      totalPoints
      bonusPoints
      penaltyPoints
      categoryResults {
        id
        points
        comment
        category {
          id
        }
        criterionResults {
          id
          points
          criterion {
            id
          }
        }
      }
    }
  }
`;

interface Props {
  copyId?: string;
  scale: Scale;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default async function CopyDialog({ copyId, scale, student }: Props) {
  async function getCopy(copyId?: string): Promise<Copy> {
    if (copyId) {
      return await dgraphQuery(GET_COPY, { copyId }, "getCopy", `getCopy${copyId}`);
    } else {
      return {
        totalPoints: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        categoryResults: scale.categories.map((cat) => ({
          id: cat.id,
          points: -1,
          comment: "",
          category: { id: cat.id },
          criterionResults: cat.criteria.map((crit) => ({
            id: crit.id,
            points: -1,
            criterion: { id: crit.id },
          })),
        })),
      };
    }
  }

  const copy = await getCopy(copyId);
  return <CopyForm copy={copy} scale={scale} student={student} />;
}
