const TAVILY_API_URL = "https://api.tavily.com/search";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

export async function runWebSearch(query: string, maxResults = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("Web search is not configured. Add TAVILY_API_KEY to the server environment.");
  }

  const res = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: Math.min(maxResults, 10),
      include_answer: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Tavily API error ${res.status}: ${err}`);
  }

  const body = (await res.json()) as TavilyResponse;
  const results = body.results ?? [];

  if (results.length === 0) {
    return `No results found for: "${query}"`;
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.content}`)
    .join("\n\n");
}

const MAX_FETCH_SIZE = 50_000;
const FETCH_TIMEOUT = 10_000;

export async function runWebFetch(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Jacq-PA/1.0" },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/") && !contentType.includes("application/json")) {
      return `Cannot read this content type: ${contentType}. Only text and JSON pages are supported.`;
    }

    let text = await res.text();
    if (text.length > MAX_FETCH_SIZE) {
      text = text.slice(0, MAX_FETCH_SIZE);
    }

    // Strip HTML tags to get readable text
    if (contentType.includes("html")) {
      // Remove script/style blocks
      text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
      text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
      // Remove tags
      text = text.replace(/<[^>]+>/g, " ");
      // Collapse whitespace
      text = text.replace(/\s+/g, " ").trim();
    }

    // Truncate for LLM context
    if (text.length > 4000) {
      text = text.slice(0, 4000) + "\n...(truncated)";
    }

    return text || "(Page returned no readable text)";
  } finally {
    clearTimeout(timeout);
  }
}
