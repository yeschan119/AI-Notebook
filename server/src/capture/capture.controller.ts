import { Body, Query, Controller, Post, Get, Delete, Param } from "@nestjs/common";
import { CaptureService } from "./capture.service";
import { CaptureChatgptDto } from "./dto/capture-chatgpt.dto";

@Controller("api/chatgpt")
export class CaptureController {
    constructor(private readonly captureService: CaptureService) {}

    @Post("capture")
    async capture(@Body() dto: CaptureChatgptDto) {
        console.log('CAPTURE API CALLED');
        return this.captureService.saveChatgptCapture(dto);
    }

    @Get('questionList')
    async getQuestionList() {
        return this.captureService.loadQuestions();
    }

    @Get('questions')
    async getQuestions(@Query('query') query? : string) {
        return this.captureService.getQuestions(query);
    }

    @Get('questions/:id')
    async getQuestionDetail(@Param('id') id: string) {
        return this.captureService.getQuestionDetail(id);
    }

    @Delete('questions')
    async deleteQuestions(@Body() body: { ids: string[] }) {
        return this.captureService.deleteQuestions(body.ids);
    }
}