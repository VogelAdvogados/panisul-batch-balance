// Supabase Edge Function: OCR.space proxy with CORS
// Public function to OCR PDFs/Images using OCR.space. Accepts multipart/form-data or JSON { url }.
// Returns { success, text, raw }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("OCR_SPACE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OCR_SPACE_API_KEY secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // multipart/form-data path (file upload)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const language = (form.get("language") as string) || "por"; // Portuguese default

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "File is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ocrForm = new FormData();
      ocrForm.append("apikey", apiKey);
      ocrForm.append("file", file, file.name);
      ocrForm.append("language", language);
      ocrForm.append("isOverlayRequired", "false");
      ocrForm.append("OCREngine", "2");

      const ocrRes = await fetch(OCR_ENDPOINT, { method: "POST", body: ocrForm });
      const data = await ocrRes.json();

      if (!ocrRes.ok) {
        return new Response(JSON.stringify({ error: "OCR failed", data }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const text = Array.isArray(data?.ParsedResults)
        ? data.ParsedResults.map((r: any) => r.ParsedText).join("\n")
        : "";

      return new Response(JSON.stringify({ success: true, text, raw: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON body path { url }
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const url = body?.url;
      const language = body?.language || "por";

      if (!url) {
        return new Response(JSON.stringify({ error: "url is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ocrForm = new FormData();
      ocrForm.append("apikey", apiKey);
      ocrForm.append("url", url);
      ocrForm.append("language", language);
      ocrForm.append("isOverlayRequired", "false");
      ocrForm.append("OCREngine", "2");

      const ocrRes = await fetch(OCR_ENDPOINT, { method: "POST", body: ocrForm });
      const data = await ocrRes.json();

      if (!ocrRes.ok) {
        return new Response(JSON.stringify({ error: "OCR failed", data }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const text = Array.isArray(data?.ParsedResults)
        ? data.ParsedResults.map((r: any) => r.ParsedText).join("\n")
        : "";

      return new Response(JSON.stringify({ success: true, text, raw: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported content-type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ocrspace-proxy error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
