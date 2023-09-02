import { DGRAPH_URL } from "@/config";
import { NextResponse } from "next/server";

const GET_EVAL = `
  query($evalId: ID!) {
    getEvaluation(id: $evalId) {
      id
      title
      coefficient
      markPrecision
      categories {
        id
        rank
        label
        maxPoints
        criteria {
          id
          rank
          label
          maxPoints
          isBonus
        }
      }
      copiesAggregate {
        count
      }
    }
  }
`;

export async function GET(_: Request, { params: { evalId } }) {
  try {
    const dgraphRes = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_EVAL,
        variables: { evalId },
      }),
      next: { tags: [`getEvaluation-${evalId}`] },
    });
    const result = await dgraphRes.json();
    return NextResponse.json({ evaluation: result.data.getEvaluation });
  } catch (err) {
    console.log(err);
  }
}
