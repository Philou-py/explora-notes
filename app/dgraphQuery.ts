import { DGRAPH_URL } from "@/config";

export async function dgraphQuery(query: string, vars: object, queryName: string, tag?: string) {
  const dgraphResponse = await fetch(DGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: vars,
    }),
    cache: "force-cache",
    ...(tag ? { next: { tags: [tag] } } : {}),
  });

  const result = await dgraphResponse.json();
  // console.log(queryName, tag, result.extensions.tracing.startTime);
  return result.data[queryName];
}
