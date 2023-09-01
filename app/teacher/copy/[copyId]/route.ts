import { DGRAPH_URL } from "@/config";
import { NextResponse } from "next/server";

const GET_COPY = `
  query($copyId: ID!) {
    getCopy(id: $copyId) {
      id
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

export async function GET(_: Request, { params: { copyId } }) {
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
    return NextResponse.json({ copy: result.data.getCopy });
  } catch (err) {
    console.log(err);
  }
}
