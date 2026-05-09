const startButton = document.getElementById("start") as HTMLButtonElement;
const stopButton = document.getElementById("stop") as HTMLButtonElement;
const statusText = document.getElementById("status") as HTMLParagraphElement;
const viewBtn = document.getElementById("view") as HTMLParagraphElement;

async function updateStatus(): Promise<void> {
    const { recordingEnabled, sessionId } = await chrome.storage.local.get([
        "recordingEnabled",
        "sessionId"
    ]);

    statusText.textContent = recordingEnabled
        ? `Recording ON\nSession: ${sessionId}`
        : "Recording OFF";
}

startButton.addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });

    const tab = tabs[0];
    console.log('tab', tabs)

    if (!tab?.url) {
        console.error("현재 탭 URL을 읽을 수 없습니다.");
        return;
    }

    const currentUrl = normalizeConversationUrl(tab.url);

    const storage = await chrome.storage.local.get(["sessionMap"]);
    const sessionMap: Record<string, string> = storage.sessionMap ?? {};
    

    const existingSessionId = sessionMap[currentUrl];
    const sessionId = existingSessionId ?? crypto.randomUUID();

    sessionMap[currentUrl] = sessionId;
    console.log('click click 시발', existingSessionId, sessionId)

    await chrome.storage.local.set({
        recordingEnabled: true,
        sessionId,
        sessionMap,
    });

    await updateStatus();
});

function normalizeConversationUrl(url: string): string {
    try {
        const parsed = new URL(url);

        const match = parsed.pathname.match(/\/c\/[^/]+/);

        if (match) {
        return `${parsed.origin}${match[0]}`;
        }

        return parsed.origin;
    } catch {
        return url;
    }
}

stopButton.addEventListener("click", async () => {
    await chrome.storage.local.set({
        recordingEnabled: false
    });

    await updateStatus();
});

viewBtn.addEventListener("click", () => {
    const notebookUrl = chrome.runtime.getURL("notebook/index.html");

    chrome.tabs.create({
        url: notebookUrl,
    });
});

updateStatus();