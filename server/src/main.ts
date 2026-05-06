import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({

      origin: [
        "https://chatgpt.com",
        "https://chat.openai.com"
      ]

    });

    await app.listen(3000);

    console.log("AI Notebook server running on http://localhost:3000");
}
bootstrap();
