type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  index: number;
  capturedAt: string;
};

let lastSnapshot = "";
let timer: number | undefined;

function detectRole(article: Element, index: number): "user" | "assistant" {
    const testId = article.getAttribute("data-testid") ?? "";

    if (testId.includes("user")) return "user";
    if (testId.includes("assistant")) return "assistant";

    return index % 2 === 0 ? "user" : "assistant";
}

function extractMessages(): ChatMessage[] {
    const nodes = document.querySelectorAll(
        '[data-message-author-role]'
    );

    return Array.from(nodes)
        .map((node, index): ChatMessage | null => {
        const roleAttr = node.getAttribute("data-message-author-role");

        const role =
            roleAttr === "user"
            ? "user"
            : roleAttr === "assistant"
            ? "assistant"
            : null;

        if (!role) return null;

        const content = node.textContent?.trim();

        if (!content) return null;

        return {
            role,
            content,
            index,
            capturedAt: new Date().toISOString()
        };
        })
    .filter((m): m is ChatMessage => m !== null);
}

function captureIfChanged(): void {
    const messages = extractMessages();
    const snapshot = JSON.stringify(messages);

    if (snapshot === lastSnapshot) return;

    lastSnapshot = snapshot;

    chrome.runtime.sendMessage(
    {
        type: "CHATGPT_MESSAGES_CAPTURED",
        payload: {
        url: location.href,
        title: document.title,
        messages,
        capturedAt: new Date().toISOString()
        }
    }).then((response) => {
        console.log("send message response: ", response);
    }).catch((error) => {
        console.error("send mesage failed:", error);
    });
}

const observer = new MutationObserver(() => {
    if (timer) {
        window.clearTimeout(timer);
    }

    timer = window.setTimeout(captureIfChanged, 1000);
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});

captureIfChanged();