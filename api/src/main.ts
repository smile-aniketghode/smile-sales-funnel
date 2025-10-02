import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for UI
  const port = process.env.PORT || 3001; // Use port 3001 by default (3000 often taken by Open WebUI)
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();