import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site-metadata";

export const OG_SIZE = { width: 1200, height: 630 };

const TRAVEL_BG =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=630&fit=crop&q=85&auto=format";

const FOREST = "#214E34";
const GOLD = "#D4AF37";
const SAGE = "#E8EDE6";
const CREAM = "#F5F0E8";

async function loadFonts() {
  const [interSemiBold, interRegular] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiA.woff"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff"
    ).then((res) => res.arrayBuffer()),
  ]);

  return [
    {
      name: "Inter",
      data: interSemiBold,
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: interRegular,
      weight: 400 as const,
      style: "normal" as const,
    },
  ];
}

function LogoMark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 18,
          background: SAGE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${FOREST}`,
        }}
      >
        <div
          style={{
            fontSize: 44,
            color: GOLD,
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          ✦
        </div>
      </div>
      <span
        style={{
          fontSize: 36,
          fontWeight: 600,
          color: CREAM,
          letterSpacing: -0.5,
        }}
      >
        Fore Beyond
      </span>
    </div>
  );
}

export async function generateOgImage() {
  const fonts = await loadFonts();
  const siteHost = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Inter",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TRAVEL_BG}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: `linear-gradient(105deg, ${FOREST} 0%, ${FOREST} 54%, rgba(33, 78, 52, 0.78) 70%, rgba(33, 78, 52, 0.4) 100%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <LogoMark />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 720,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 600,
                color: CREAM,
                lineHeight: 1.1,
                letterSpacing: -1,
              }}
            >
              Travel Deeper. Belong Anywhere.
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: "rgba(245, 240, 232, 0.92)",
                lineHeight: 1.35,
              }}
            >
              Stay with verified local hosts around the world.
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(245, 240, 232, 0.75)",
              fontWeight: 400,
            }}
          >
            {siteHost}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
    }
  );
}
