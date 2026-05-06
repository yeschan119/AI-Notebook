import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CaptureModule } from './capture/capture.module';

@Module({
  imports: [CaptureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
