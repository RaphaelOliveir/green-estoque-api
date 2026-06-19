import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Green Estoque API')
    .setDescription(
      `API de gerenciamento de estoque para loja de painéis solares.

## Autenticação
Use o endpoint \`POST /api/v1/auth/login\` para obter o token JWT.
Inclua o token no header: \`Authorization: Bearer <token>\`
      `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticação e perfil do usuário')
    .addTag('Usuários', 'Gerenciamento de usuários')

    .addTag('Produtos', 'Cadastro e consulta de painéis solares')
    .addTag('Estoque / Unidades Físicas', 'Gerenciamento de unidades físicas individuais em estoque')
    .addTag('Relatórios', 'Relatórios e análises')
    .build();

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 Server running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/docs\n`);
}

bootstrap();
