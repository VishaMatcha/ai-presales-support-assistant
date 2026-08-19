import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentService } from './assistant/agent.service.js';
import { ChatGateway } from './assistant/chat.gateway.js';
import { IntakeService } from './assistant/intake.service.js';
import { IntentRouterService } from './assistant/intent-router.service.js';
import { SessionService } from './assistant/session.service.js';
import { SupportService } from './assistant/support.service.js';
import { HealthController } from './health.controller.js';
import { LlmService } from './llm/llm.service.js';
import { EmbeddingService } from './rag/embedding.service.js';
import { BitextKnowledgeBase } from './rag/bitext-knowledge-base.js';
import { KnowledgeBaseRegistry } from './rag/knowledge-base.registry.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController],
  providers: [
    ChatGateway,
    AgentService,
    IntakeService,
    IntentRouterService,
    SessionService,
    SupportService,
    LlmService,
    EmbeddingService,
    BitextKnowledgeBase,
    KnowledgeBaseRegistry,
  ],
})
export class AppModule {}
