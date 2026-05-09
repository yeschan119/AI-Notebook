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
    const { sessionId } = await chrome.storage.local.get(["sessionId"]);

    await chrome.storage.local.set({
        recordingEnabled: true,
        sessionId: sessionId ?? crypto.randomUUID(),
    });

    await updateStatus();
});

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