import { Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AgentService } from './agent.service.js';
import { ChatMessageDto } from './chat.types.js';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_ORIGIN?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000'] } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(@Inject(AgentService) private readonly agent: AgentService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('chat:message')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async onMessage(@MessageBody() input: ChatMessageDto, @ConnectedSocket() client: Socket) {
    client.emit('chat:status', { working: true });
    try {
      const response = await this.agent.handle(input.sessionId, input.message.trim());
      client.emit('chat:response', response);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      client.emit('chat:error', { message });
      return { error: message };
    } finally {
      client.emit('chat:status', { working: false });
    }
  }
}
