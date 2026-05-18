"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";

/**
 * Voice Input + Transcription
 *
 * Demonstrates browser-native SpeechRecognition API (zero external deps):
 * - Real-time transcription while speaking
 * - Final transcript injected via useCopilotReadable into agent context
 * - useCopilotAction "sendVoiceMessage" lets the agent respond to voice prompts
 * - Full transcript history
 */

type TranscriptEntry = {
  id: string;
  text: string;
  timestamp: string;
  type: "interim" | "final" | "response";
};

// Browser SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [history, setHistory] = useState<TranscriptEntry[]>([]);
  const [supported, setSupported] = useState(true);
  const [agentResponse, setAgentResponse] = useState("");
  const recognitionRef = useRef<any>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
      if (final) {
        setFinalTranscript(final.trim());
        setInterimText("");
        setHistory((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: final.trim(),
            timestamp: new Date().toLocaleTimeString(),
            type: "final",
          },
        ]);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Expose latest voice transcript to the agent
  useCopilotReadable({
    description: "Latest voice transcript from the user",
    value: finalTranscript || "No voice input yet",
  });

  useCopilotReadable({
    description: "Full voice conversation history",
    value: history.length
      ? history.map((h) => `[${h.timestamp}] ${h.type.toUpperCase()}: ${h.text}`).join("\n")
      : "No conversation history",
  });

  // Action: agent sends a response to the voice input
  useCopilotAction({
    name: "respondToVoice",
    description: "Respond to the user's voice input. Display your response in the voice panel.",
    parameters: [
      { name: "response", type: "string", required: true, description: "Your response to the voice input" },
      { name: "action", type: "string", required: false, description: "Optional action taken, e.g. 'queried database', 'searched documents'" },
    ],
    handler: async ({ response, action }) => {
      const text = action ? `${response} (${action})` : (response as string);
      setAgentResponse(text);
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text,
          timestamp: new Date().toLocaleTimeString(),
          type: "response",
        },
      ]);
      // Text-to-speech: speak the response back
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(response as string);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
      return "Response displayed and spoken.";
    },
  });

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setFinalTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const clearHistory = () => {
    setHistory([]);
    setFinalTranscript("");
    setAgentResponse("");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">🎙️ Voice Input + Transcription</h1>
        <p className="text-slate-600 mt-1 max-w-3xl">
          Speak your query — the browser&apos;s{" "}
          <code className="text-xs bg-slate-100 px-1 rounded">SpeechRecognition</code> API
          transcribes in real-time. The transcript is injected via{" "}
          <code className="text-xs bg-slate-100 px-1 rounded">useCopilotReadable</code> and the
          agent responds via text-to-speech.
        </p>
      </header>

      {!supported && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          ⚠️ Your browser does not support the SpeechRecognition API. Try Chrome or Edge.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Microphone panel */}
        <div className="space-y-4">
          {/* Mic button */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center gap-5">
            <button
              onClick={toggleListening}
              disabled={!supported}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all duration-200 ${
                isListening
                  ? "bg-rose-500 hover:bg-rose-600 scale-110 shadow-rose-200"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-40" />
              )}
              {isListening ? "⏹️" : "🎙️"}
            </button>

            <div className="text-center">
              <p className={`font-semibold text-sm ${isListening ? "text-rose-600" : "text-slate-600"}`}>
                {isListening ? "Listening… click to stop" : "Click to speak"}
              </p>
              {isListening && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-rose-400 rounded-full animate-bounce"
                      style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live transcript */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 min-h-20">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Live Transcript
            </p>
            {interimText ? (
              <p className="text-slate-400 italic text-sm">{interimText}…</p>
            ) : finalTranscript ? (
              <p className="text-slate-800 text-sm">{finalTranscript}</p>
            ) : (
              <p className="text-slate-300 text-sm">Start speaking to see transcript here</p>
            )}
          </div>

          {/* Agent response */}
          {agentResponse && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                🤖 Agent Response (spoken aloud)
              </p>
              <p className="text-sm text-indigo-900">{agentResponse}</p>
            </div>
          )}

          {/* Tech info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">⚙️ How it works</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>① Browser <code>SpeechRecognition</code> API — zero external deps</li>
              <li>② Real-time interim results while you speak</li>
              <li>③ Final transcript → <code>useCopilotReadable</code> → agent context</li>
              <li>④ Agent reads transcript, answers via <code>respondToVoice</code></li>
              <li>⑤ Response spoken via <code>SpeechSynthesis</code> API</li>
            </ul>
          </div>
        </div>

        {/* Conversation history */}
        <div className="rounded-2xl border border-slate-200 bg-white flex flex-col" style={{ minHeight: "400px" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Conversation History</p>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-slate-400 hover:text-slate-600">
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm text-slate-400">Speak something to start the conversation</p>
              </div>
            )}
            {history.map((entry) => (
              <div
                key={entry.id}
                className={`flex gap-3 ${entry.type === "response" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    entry.type === "response" ? "bg-indigo-100" : "bg-slate-100"
                  }`}
                >
                  {entry.type === "response" ? "🤖" : "🎙️"}
                </div>
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                    entry.type === "response"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : entry.type === "interim"
                      ? "bg-slate-100 text-slate-400 italic"
                      : "bg-slate-100 text-slate-800 rounded-tl-sm"
                  }`}
                >
                  <p>{entry.text}</p>
                  <p className={`text-xs mt-1 ${entry.type === "response" ? "text-indigo-200" : "text-slate-400"}`}>
                    {entry.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        </div>
      </div>

      <CopilotPopup
        defaultOpen
        instructions={`You are a voice assistant. The user is speaking to you via their microphone.

The latest transcript is available in your context under "Latest voice transcript from the user".
The full conversation history is under "Full voice conversation history".

When the user has spoken (transcript is not empty):
1. Understand their request
2. If they ask about data: use the appropriate data tools (wireless_summary, finance_summary, etc.)
3. If they ask about policies or plans: use search_documents
4. ALWAYS call respondToVoice(response, action?) to reply
   - response: your spoken answer — keep it conversational and concise (1-3 sentences max for voice)
   - action: optional, what you did (e.g. "queried wireless database")

Keep responses SHORT — they will be spoken aloud. Avoid lists or markdown in voice responses.
If no transcript yet, greet the user and ask them to speak.`}
        labels={{
          title: "Voice Assistant",
          initial: "🎙️ Click the microphone and speak your query. I'll transcribe in real-time and respond with both text and audio!",
        }}
      />
    </div>
  );
}
