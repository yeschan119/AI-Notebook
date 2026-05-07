import { useEffect, useMemo, useState } from "react";

type QuestionItem = {
  id: string;
  question: string;
  sessionId: string;
  capturedAt: string;
  url: string;
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
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const filteredQuestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();

      if (!keyword) return questions;

      return questions.filter((item) =>
        item.question.toLowerCase().includes(keyword)
      );
  }, [questions, query]);

  const allVisibleSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((item) => selectedQuestionIds.includes(item.id));

    function toggleQuestion(id: string) {
      setSelectedQuestionIds((prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id]
      );
    }

    function toggleAllVisible() {
      if (allVisibleSelected) {
        setSelectedQuestionIds((prev) =>
          prev.filter((id) => !filteredQuestions.some((q) => q.id === id))
        );
      } else {
        setSelectedQuestionIds((prev) =>
          Array.from(new Set([...prev, ...filteredQuestions.map((q) => q.id)]))
        );
      }
    }

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

  async function deleteSelectedQuestions() {
    if (selectedQuestionIds.length === 0) return;
    const ok = window.confirm(`${selectedQuestionIds.length}개 항목을 삭제할까요?`);

    if (!ok) return;
    const res = await fetch(`${API_BASE}/questions`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: selectedQuestionIds,
      }),
    });

    if (!res.ok) {
      console.error("삭제 실패:", res.status);
      return;
    }

    setSelectedQuestionIds([]);
    setSelectedId(null);
    setDetail(null);
    await loadQuestions();
  }

  function normalizeText(text: string) {
    return text
      .replace(/\n{3,}/g, "\n")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: "#212121",
        color: "#ececec",
        boxSizing: "border-box",
      }}
    >
      <aside
        style={{
          width: 400,
          flexShrink: 0,
          borderRight: "1px solid #2f2f2f",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "#171717",
          boxSizing: "border-box",
        }}
      >

        <h2 style={{ margin: "0 0 16px" }}>AI Notebook</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="질문 검색"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #3f3f46",
              background: "#2f2f2f",
              color: "#ececec",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={loadQuestions}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #3f3f46",
              background: "#2f2f2f",
              color: "#ececec",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            새로고침
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#a3a3a3",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
            />
            전체 선택
          </label>

          <button
            onClick={deleteSelectedQuestions}
            disabled={selectedQuestionIds.length === 0}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ef4444",
              background:
                selectedQuestionIds.length === 0 ? "#2f2f2f" : "#7f1d1d",
              color: "#fff",
              cursor: selectedQuestionIds.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            삭제 {selectedQuestionIds.length > 0 ? `(${selectedQuestionIds.length})` : ""}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {filteredQuestions.length === 0 && (
            <p style={{ color: "#a3a3a3" }}>검색 결과가 없습니다.</p>
          )}

          {filteredQuestions.map((item, index) => (
            <div
              key={`${item.id}-${item.sessionId}-${item.capturedAt}-${index}`}
              onClick={() => setSelectedId(item.id)}
              style={{
                padding: 12,
                marginBottom: 8,
                cursor: "pointer",
                borderRadius: 10,
                border:
                  selectedId === item.id
                    ? "1px solid #565869"
                    : "1px solid #3f3f46",
                background: selectedId === item.id ? "#2f2f2f" : "#1f1f1f",
                color: "#ececec",
                boxSizing: "border-box",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >

                <input
                  type="checkbox"
                  checked={selectedQuestionIds.includes(item.id)}
                  onChange={() => toggleQuestion(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.question}
                  </div>
                  <small style={{ color: "#a3a3a3" }}>
                    {new Date(item.capturedAt).toLocaleString()}
                  </small>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: "#10a37f",
                    textDecoration: "none",
                    fontSize: 11,
                    flexShrink: 0,
                    padding: "3px 5px",
                    borderRadius: 6,
                    border: "1px solid #10a37f",
                  }}
                >
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflowY: "auto",
          background: "#212121",
          boxSizing: "border-box",
        }}
      >

        {!detail && (
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "48px 40px",
              color: "#a3a3a3",
            }}
          >
            질문을 선택하세요.
          </div>
        )}

        {detail?.messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={`${message.role}-${message.index}`}
              style={{
                width: "100%",
                background: isUser ? "#212121" : "#303030",
                boxSizing: "border-box",
              }}
            >

              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "24px 40px",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isUser ? "#3b82f6" : "#10a37f",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >

                  {isUser ? "U" : "AI"}
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      color: "#ececec",
                    }}
                  >

                    {isUser ? "User" : "ChatGPT"}
                  </div>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.65,
                      color: "#ececec",
                      fontSize: 15,
                      overflowWrap: "break-word",
                    }}
                  >
                    {normalizeText(message.content)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}