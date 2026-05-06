type CapturePayload = {
  url: string;
  title: string;
  capturedAt: string;
  messages: ChatMessage[];
};

type RuntimeMessage = {
  type: "CHATGPT_MESSAGES_CAPTURED";
  payload: CapturePayload;
};

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {

    if (message.type !== "CHATGPT_MESSAGES_CAPTURED") {
      return false;
    }

    handleCapture(message.payload)
      .then(() => {
        sendResponse({ ok: true });
      })
      .catch((error: Error) => {
        console.error("capture failed", error);
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  }
);

async function handleCapture(payload: CapturePayload): Promise<void> {
  const storage = await chrome.storage.local.get([
    "recordingEnabled",
    "sessionId"
  ]);

  const recordingEnabled = storage.recordingEnabled ?? false;
  const sessionId = storage.sessionId ?? "default";

  if (!recordingEnabled) {
    console.log("recording disabled");
    return;
  }

  const response = await fetch("http://localhost:3000/api/chatgpt/capture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId,
      ...payload
    })
  });

  console.log("capture response", response.status);
}