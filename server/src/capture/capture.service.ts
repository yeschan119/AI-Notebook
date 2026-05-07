import { Injectable } from "@nestjs/common";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { CaptureChatgptDto } from "./dto/capture-chatgpt.dto";

type CaptureEvent = {
    sessionId: string;
    url: string;
    title: string;
    capturedAt: string;
    messages: {
        role: 'user' | 'assistant';
        content: string;
        index: number;
        capturedAt?: string;
    }[];
};

@Injectable()
export class CaptureService {
        private readonly baseDir = path.resolve(process.cwd(), 'ai-sessions');
        async readEvents() {
            const sessions = await fs.readdir(this.baseDir).catch(() => []);
        const allEvents: CaptureEvent[] = [];
        for (const sessionId of sessions) {
            const filePath = path.join(this.baseDir, sessionId, 'events.jsonl');
            const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
            if (!content) continue;
            const events = content
            .split('\n')
            .filter(Boolean)
            .map(line => {
                try {
                return JSON.parse(line);
                } catch {
                return null;
                }
            })
            .filter(Boolean);
            allEvents.push(...events);
        }
        return allEvents;
    }

    async saveChatgptCapture(dto: CaptureChatgptDto) {
        const sessionId = dto.sessionId || "default";

        const dir = path.join(process.cwd(), "ai-sessions", sessionId);
        await fs.mkdir(dir, { recursive: true });

        const filePath = path.join(dir, "events.jsonl");

        const event = {
            type: "CHATGPT_CAPTURE",
            ...dto,
            capturedAt: dto.capturedAt || new Date().toISOString(),
        };

        const lastEvent = await this.getLastEvent(filePath);

        if (lastEvent && this.isSameConversationSnapshot(lastEvent, event)) {
            return {
            ok: true,
            skipped: true,
            reason: "duplicate snapshot",
            sessionId,
            messageCount: dto.messages?.length ?? 0,
            };
        }

        await fs.appendFile(filePath, JSON.stringify(event) + "\n", "utf8");

        return {
            ok: true,
            skipped: false,
            sessionId,
            messageCount: dto.messages?.length ?? 0,
        };
        }

    private async getLastEvent(filePath: string): Promise<any | null> {
        const content = await fs.readFile(filePath, "utf8").catch(() => "");

        const lines = content.split("\n").filter(Boolean);

        if (lines.length === 0) return null;

        try {
            return JSON.parse(lines[lines.length - 1]);
        } catch {
            return null;
        }
        }

        private isSameConversationSnapshot(a: any, b: any): boolean {
        const aMessages = a.messages ?? [];
        const bMessages = b.messages ?? [];

        if (aMessages.length !== bMessages.length) return false;

        return aMessages.every((msg: any, index: number) => {
            const other = bMessages[index];

            return (
            other &&
            msg.role === other.role &&
            msg.content === other.content &&
            msg.index === other.index
            );
        });
    }

    async getQuestions(query?: string) {
            const events = await this.readEvents();
            const questions = events.flatMap((event) =>
                event.messages
                .filter((message) => message.role === 'user')
                .map((message) => ({
                    id: `${event.sessionId}-${message.index}`,
                    sessionId: event.sessionId,
                    question: message.content,
                    url: event.url,
                    capturedAt: message.capturedAt ?? event.capturedAt,
                })),
            );

            const keyword = query?.trim().toLowerCase();
            if (!keyword) {
                return questions;
            }

            return questions.filter((item) =>
                item.question.toLowerCase().includes(keyword),
            );
    }

    async loadQuestions() {
        const events = await this.readEvents();

        const map = new Map<string, any>();

        for (const event of events) {
            for (const message of event.messages ?? []) {
            if (message.role !== "user") continue;

            const key = `${event.sessionId}:${message.index}:${message.content}`;

            map.set(key, {
                id: `${event.sessionId}-${message.index}`,
                sessionId: event.sessionId,
                question: message.content,
                url: event.url,
                capturedAt: message.capturedAt ?? event.capturedAt,
            });
            }
        }

        return Array.from(map.values()).sort(
            (a, b) =>
            new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
        );
    }

    async getQuestionDetail(id: string) {
        const events = await this.readEvents();

        for (const event of events) {
            const targetIndex = Number(id.split('-').at(-1));

            const question = event.messages.find(
                (message) => message.role === 'user' && message.index == targetIndex,
            )

            if (!question) continue;
            const nextUser = event.messages.find(
                (message) => message.role === 'user' && message.index > targetIndex,
            );

            const messages = event.messages.filter((message) => {

                if (message.index < targetIndex) return false;
                if (nextUser && message.index >= nextUser.index) return false;
                    return true;
            });

            return {
                id,
                sessionId: event.sessionId,
                url: event.url,
                question: question.content,
                messages,
            };
        }

        return null;
    }
}