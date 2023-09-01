import { DGRAPH_URL } from "@/config";

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

export default async function GET(_: Request, { params: { copyId } }) {
  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_COPY,
        variables: { copyId },
      }),
      next: { tags: [`getCopy-${copyId}`] },
    });
    const result = await dgraphRes.json();
    return result.data.getCopy;
  } catch (err) {
    console.log(err);
  }
}
