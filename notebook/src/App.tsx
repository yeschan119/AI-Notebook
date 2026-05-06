import { useEffect, useMemo, useState } from "react";

type QuestionItem = {
  id: string;
  question: string;
  sessionId: string;
  capturedAt: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  index: number;
};

type QuestionDetail = {
  id: string;
  question: string;
  messages: ChatMessage[];
};

const API_BASE = "http://localhost:3000/api/chatgpt";

export default function App() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuestionDetail | null>(null);
  const [query, setQuery] = useState("");

  const filteredQuestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();

      if (!keyword) return questions;

      return questions.filter((item) =>
        item.question.toLowerCase().includes(keyword)
      );
  }, [questions, query]);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadDetail(selectedId);
  }, [selectedId]);

  async function loadQuestions() {
    const res = await fetch(`${API_BASE}/questionList`);

    if (!res.ok) {
      console.error("질문 목록 조회 실패:", res.status);
      return;
    }

    const data: QuestionItem[] = await res.json();

    console.log("API data:", data);
    console.log("API data length:", data.length);

    setQuestions([...data]);
    setQuery("");
    setSelectedId(null);
    setDetail(null);
  }

  async function loadDetail(id: string) {
    const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(id)}`);

    if (!res.ok) {
      console.error("상세 조회 실패:", res.status);
      return;
    }

    const data: QuestionDetail = await res.json();
    setDetail(data);
  }

  function normalizeText(text: string) {
    return text
      .replace(/\n{3,}/g, "\n")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <aside
        style={{
          width: 360,
          borderRight: "1px solid #ddd",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <h2>AI Notebook</h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="질문 검색"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={loadQuestions}>새로고침</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredQuestions.length === 0 && (
            <p style={{ color: "#666" }}>검색 결과가 없습니다.</p>
          )}

          {filteredQuestions.map((item, index) => (
            <div
              key={`${item.id}-${item.sessionId}-${item.capturedAt}-${index}`}
              onClick={() => setSelectedId(item.id)}
              style={{
                padding: 12,
                marginBottom: 8,
                cursor: "pointer",
                border: "1px solid #ddd",
                borderRadius: 8,
                background: selectedId === item.id ? "#eee" : "#fff",
              }}
            >
              <strong>{item.question}</strong>
              <br />
              <small>{new Date(item.capturedAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {!detail && <p>질문을 선택하세요.</p>}

        {detail?.messages.map((message) => (
          <div
            key={`${message.role}-${message.index}`}
            style={{
              marginBottom: 16,
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: message.role === "user" ? "#f1f5f9" : "#fff",
            }}
          >
            <strong>{message.role === "user" ? "User" : "ChatGPT"}</strong>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, margin: 0 }}>
              {normalizeText(message.content)}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}