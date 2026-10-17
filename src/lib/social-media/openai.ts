import { SOCIAL_BRAND } from "@/lib/social-media/brand";

function getOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return key;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function openAiChatJson<T>(
  messages: ChatMessage[],
  model = "gpt-4o-mini"
): Promise<T> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI chat failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(content) as T;
}

export async function generateEditorialImage(prompt: string): Promise<Buffer> {
  const enhancedPrompt = `${prompt}. ${SOCIAL_BRAND.visual.quality}. Natural light, photorealistic editorial travel photography, warm authentic lifestyle moment, no text, no logos, no watermarks, no cartoon style.`;

  async function requestImage(model: string, size: string): Promise<Buffer> {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: enhancedPrompt,
        size,
        quality: model === "dall-e-3" ? "hd" : "high",
        n: 1,
        response_format: model === "dall-e-3" ? "b64_json" : undefined,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI image failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };

    const item = data.data?.[0];
    if (item?.b64_json) {
      return Buffer.from(item.b64_json, "base64");
    }

    if (item?.url) {
      const imageResponse = await fetch(item.url);
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image.");
      }
      return Buffer.from(await imageResponse.arrayBuffer());
    }

    throw new Error("OpenAI image response missing data.");
  }

  try {
    return await requestImage("gpt-image-1", "1024x1024");
  } catch {
    return requestImage("dall-e-3", "1024x1024");
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await fn(items[current]!, current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
