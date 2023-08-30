import { DGRAPH_URL } from "@/config";

export async function dgraphQuery(query: string, variables: object, queryName: string) {
  try {
    const dgraphResponse = await fetch(DGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store", // Just to make sure
    });

    const result = await dgraphResponse.json();
    // console.log("dgraphQuery", result.extensions.tracing.startTime);
    return result.data[queryName];
  } catch (error) {
    console.log(error);
  }
}
