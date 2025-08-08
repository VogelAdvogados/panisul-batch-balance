// Supabase Edge Function: OCR.space proxy
// Recebe um arquivo (PDF/Imagem) via multipart/form-data e encaminha para o OCR.space
// Retorna o texto extraído e o JSON bruto da API

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("OCR_SPACE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OCR_SPACE_API_KEY secret" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // Suporta multipart/form-data para upload direto do arquivo
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const language = (form.get("language") as string) || "por"; // Português por padrão

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "File is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const ocrForm = new FormData();
      ocrForm.append("apikey", apiKey);
      ocrForm.append("file", file, file.name);
      ocrForm.append("language", language);
      ocrForm.append("isOverlayRequired", "false");
      ocrForm.append("OCREngine", "2");

      const ocrRes = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: ocrForm,
      });

      const data = await ocrRes.json();
      if (!ocrRes.ok) {
        return new Response(JSON.stringify({ error: "OCR failed", data }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Extrai texto simples
      const text = Array.isArray(data?.ParsedResults)
        ? data.ParsedResults.map((r: any) => r.ParsedText).join("\n")
        : "";

      return new Response(
        JSON.stringify({ success: true, text, raw: data }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Alternativamente, aceita JSON com { url }
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const url = body?.url;
      const language = body?.language || "por";
      if (!url) {
        return new Response(JSON.stringify({ error: "url is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const ocrForm = new FormData();
      ocrForm.append("apikey", apiKey);
      ocrForm.append("url", url);
      ocrForm.append("language", language);
      ocrForm.append("isOverlayRequired", "false");
      ocrForm.append("OCREngine", "2");

      const ocrRes = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: ocrForm,
      });

      const data = await ocrRes.json();
      if (!ocrRes.ok) {
        return new Response(JSON.stringify({ error: "OCR failed", data }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const text = Array.isArray(data?.ParsedResults)
        ? data.ParsedResults.map((r: any) => r.ParsedText).join("\n")
        : "";

      return new Response(
        JSON.stringify({ success: true, text, raw: data }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unsupported content-type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ocrspace-proxy error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
