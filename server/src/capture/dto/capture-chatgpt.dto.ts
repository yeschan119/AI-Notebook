export type ChatRole = "user" | "assistant";

export class CaptureChatgptDto {
    sessionId!: string;
    url!: string;
    title!: string;
    capturedAt!: string;

    messages!: {
        role: ChatRole;
        content: string;
        index: number;
        capturedAt: string;
    }[];
}