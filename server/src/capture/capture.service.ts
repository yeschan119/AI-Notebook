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

        const event = {
                type: "CHATGPT_CAPTURE",
                ...dto,
                capturedAt: dto.capturedAt || new Date().toISOString()
            };

            await fs.appendFile(
                path.join(dir, "events.jsonl"),
                JSON.stringify(event) + "\n",
                "utf8"
            );

        return {
            ok: true,
            sessionId,
            messageCount: dto.messages?.length ?? 0
        };
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

            return questions;
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