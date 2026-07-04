import { NextRequest, NextResponse } from "next/server";
import {
  LATIN_SOURCE_FALLBACKS,
  detectSourceLanguage,
  isMyMemoryErrorText,
  normalizeLangCode,
} from "@/lib/language-detect";

const MAX_TEXT_LENGTH = 2000;

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
  responseDetails?: string;
  quotaFinished?: boolean | null;
}

async function fetchMyMemoryTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const langpair = `${sourceLang}|${targetLang}`;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langpair);

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "ForeBeyond/1.0" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as MyMemoryResponse;
  const status = Number(data.responseStatus);
  const translated = data.responseData?.translatedText?.trim();

  if (status !== 200 || !translated || isMyMemoryErrorText(translated)) {
    return null;
  }

  return translated;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string;
      targetLang?: string;
      sourceLang?: string;
    };

    const text = body.text?.trim();
    const targetLang = (body.targetLang ?? "en").slice(0, 5);
    const targetBase = normalizeLangCode(targetLang);

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is too long" }, { status: 400 });
    }

    const explicitSource = body.sourceLang?.trim().slice(0, 5);
    const detectedSource = explicitSource ?? detectSourceLanguage(text);

    if (detectedSource && normalizeLangCode(detectedSource) === targetBase) {
      return NextResponse.json({
        translatedText: text,
        targetLang,
      });
    }

    const sourceCandidates = [
      ...(detectedSource ? [detectedSource] : []),
      ...LATIN_SOURCE_FALLBACKS,
    ].filter((source, index, all) => {
      const base = normalizeLangCode(source);
      return base !== targetBase && all.indexOf(source) === index;
    });

    for (const sourceLang of sourceCandidates) {
      const translated = await fetchMyMemoryTranslation(text, sourceLang, targetLang);
      if (translated) {
        return NextResponse.json({
          translatedText: translated,
          targetLang,
          sourceLang,
        });
      }
    }

    return NextResponse.json({ error: "Could not translate text" }, { status: 422 });
  } catch (error) {
    console.error("Translate API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
