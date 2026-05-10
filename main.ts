// main.ts - GoldFireDragon Full Version
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { serveFile } from "jsr:@std/http/file-server";

// ====================== 설정 ======================
const FIREDRAGON_UA = "Mozilla/9.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 FireDragon/135.0 stealth privatebrowsing incognito windowedfullscreen";
const JAPAN_IP = "109.123.230.28";

const ALLOWED = [
  "hitomi.la", "hiyobi.me", "nhentai.net", "e-hentai.org", "exhentai.org",
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "youporn.com",
  "redtube.com", "spankbang.com", "eporner.com", "rule34.xxx", "danbooru.donmai.us",
  "gelbooru.com", "onlyfans.com", "chaturbate.com", "bongacams.com", "stripchat.com",
  "toonkor", "toon.kor", "manatoki", "newtoki"
];

// ====================== 서버 ======================
serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // 1. 정적 HTML 파일 서빙 (루트 경로)
  if (pathname === "/" || pathname === "/index.html") {
    return serveFile(req, "./index.html");
  }

  // 2. Proxy 기능 (/proxy?url=...)
  if (pathname === "/proxy") {
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("URL parameter is required (?url=...)", { status: 400 });
    }

    try {
      const targetUrl = new URL(target);
      const hostname = targetUrl.hostname.toLowerCase();

      // 허용된 사이트 체크
      if (!ALLOWED.some(site => hostname.includes(site))) {
        return new Response("This site is not allowed.", { status: 403 });
      }

      const proxyReq = new Request(target, {
        method: req.method,
        headers: {
          ...Object.fromEntries(req.headers),
          "User-Agent": FIREDRAGON_UA,
          "X-Forwarded-For": JAPAN_IP,
          "X-Real-IP": JAPAN_IP,
          "Referer": targetUrl.origin,
        },
        body: req.body,
        redirect: "follow",
      });

      const response = await fetch(proxyReq);

      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "*");

      // 검열 헤더 제거
      headers.delete("Content-Security-Policy");
      headers.delete("X-Frame-Options");
      headers.delete("Strict-Transport-Security");

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 502 });
    }
  }

  // 기타 요청
  return new Response("Not Found", { status: 404 });
});
