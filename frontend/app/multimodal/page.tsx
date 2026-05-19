"use client";

import { useState, useRef, useCallback } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable, useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";

/**
 * Multimodal Attachments + Vision
 *
 * Demonstrates GPT-4o vision via CopilotKit:
 * - User uploads an image (JPEG/PNG/GIF/WebP)
 * - useCopilotReadable exposes metadata (filename, base64) to the agent
 * - useCopilotAction "analyzeImage" lets agent trigger structured analysis
 * - The agent responds with structured insights rendered as cards
 */

type AnalysisResult = {
  summary: string;
  objects?: string[];
  text?: string;
  colors?: string[];
  insights?: string[];
  sentiment?: string;
};

export default function MultimodalPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { appendMessage } = useCopilotChat();

  // Make the current image metadata readable to the agent
  useCopilotReadable({
    description: "Currently uploaded image",
    value: imageFile
      ? JSON.stringify({
          filename: imageFile.name,
          type: imageFile.type,
          sizeKB: Math.round(imageFile.size / 1024),
          base64DataUrl: imageBase64, // full data URL for vision
        })
      : "No image uploaded yet",
  });

  // Action: agent reports back structured analysis
  useCopilotAction({
    name: "reportImageAnalysis",
    description:
      "Report the results of analyzing the uploaded image. Call this after examining the image.",
    parameters: [
      { name: "summary", type: "string", required: true, description: "1-2 sentence summary of what is in the image" },
      { name: "objects", type: "string[]", required: false, description: "List of objects/subjects detected" },
      { name: "text", type: "string", required: false, description: "Any text visible in the image" },
      { name: "colors", type: "string[]", required: false, description: "Dominant colors" },
      { name: "insights", type: "string[]", required: false, description: "Interesting observations or insights" },
      { name: "sentiment", type: "string", required: false, description: "Overall mood/tone: positive, neutral, negative, professional, playful, etc." },
    ],
    handler: async ({ summary, objects, text, colors, insights, sentiment }) => {
      setAnalyzing(false);
      setAnalysis({
        summary: summary as string,
        objects: objects as string[] | undefined,
        text: text as string | undefined,
        colors: colors as string[] | undefined,
        insights: insights as string[] | undefined,
        sentiment: sentiment as string | undefined,
      });
      return "Analysis displayed in the panel.";
    },
  });

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImageBase64(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleFileChange(file);
    },
    [handleFileChange]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">🖼️ Multimodal — Vision Analysis</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          Upload an image and ask the AI to analyze it. Uses GPT-4o vision via{" "}
          <code className="text-xs bg-slate-100 px-1 rounded">useCopilotReadable</code> to pass
          the base64 image to the agent, which responds with structured analysis.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload panel */}
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            {imageUrl ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="max-h-64 mx-auto rounded-xl object-contain shadow-sm"
                />
                <p className="text-xs text-slate-500">{imageFile?.name} · {Math.round((imageFile?.size || 0) / 1024)} KB</p>
                <p className="text-xs text-indigo-500 group-hover:text-indigo-700">Click to change image</p>
              </div>
            ) : (
              <div className="py-8">
                <div className="text-5xl mb-3">📷</div>
                <p className="font-semibold text-slate-700">Drop an image or click to upload</p>
                <p className="text-sm text-slate-400 mt-1">JPEG, PNG, GIF, WebP supported</p>
              </div>
            )}
          </div>

          {imageUrl && (
            <button
              onClick={() => {
                setAnalyzing(true);
                setAnalysis(null);
                appendMessage(
                  new TextMessage({
                    content: "Please analyze this uploaded image in detail. Provide a comprehensive analysis including objects, colors, text, and insights.",
                    role: MessageRole.User
                  })
                );
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                "🔍 Ask AI to analyze this image"
              )}
            </button>
          )}

          {/* How it works */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">⚙️ How multimodal works</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>① Image converted to base64 data URL in browser</li>
              <li>② <code>useCopilotReadable</code> injects it into agent context</li>
              <li>③ GPT-4o reads the image from the system context</li>
              <li>④ Agent calls <code>reportImageAnalysis</code> with structured result</li>
              <li>⑤ Frontend renders the structured cards below</li>
            </ul>
          </div>
        </div>

        {/* Analysis results */}
        <div className="space-y-4">
          {!analysis && !analyzing && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-slate-500 text-sm">
                Upload an image, then ask the AI:<br />
                <em>"Analyze this image"</em> or <em>"What do you see?"</em>
              </p>
            </div>
          )}

          {analyzing && !analysis && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">AI is analyzing the image…</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Summary</p>
                <p className="text-sm leading-relaxed">{analysis.summary}</p>
                {analysis.sentiment && (
                  <span className="mt-2 inline-block text-xs px-2 py-0.5 bg-white/20 rounded-full">
                    Tone: {analysis.sentiment}
                  </span>
                )}
              </div>

              {/* Objects */}
              {analysis.objects && analysis.objects.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">🏷️ Objects Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.objects.map((obj) => (
                      <span key={obj} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Text */}
              {analysis.text && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">📝 Text in Image</p>
                  <p className="text-sm text-slate-700 font-mono bg-slate-50 rounded-lg p-2">{analysis.text}</p>
                </div>
              )}

              {/* Colors */}
              {analysis.colors && analysis.colors.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">🎨 Dominant Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.colors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">💡 Insights</p>
                  <ul className="space-y-1">
                    {analysis.insights.map((ins, i) => (
                      <li key={i} className="text-sm text-amber-800 flex gap-2">
                        <span>•</span> {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CopilotPopup
        defaultOpen
        instructions={`You are a vision AI assistant. The user has uploaded an image.

When the user asks you to analyze, describe, or examine the image:
1. Look at the base64 data URL in your context (under "Currently uploaded image" → base64DataUrl)
2. Analyze it thoroughly using your vision capabilities
3. Call reportImageAnalysis() with your findings:
   - summary: clear 1-2 sentence description
   - objects: list of detected objects, people, animals, items
   - text: any visible text, signs, labels, numbers
   - colors: 3-5 dominant colors
   - insights: 2-3 interesting observations
   - sentiment: overall mood/tone of the image

If no image is uploaded yet, ask the user to upload one first.
Always call reportImageAnalysis() — don't just describe in text.`}
        labels={{
          title: "Vision AI",
          initial: '📷 Upload an image, then ask me: "Analyze this image" or "What do you see?" — I\'ll provide structured visual analysis using GPT-4o vision.',
        }}
      />
    </div>
  );
}
