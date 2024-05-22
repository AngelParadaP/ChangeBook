// src/chat/chat.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('chat message')
  async handleMessage(
    @MessageBody() data: { message: string, room: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { message, room } = data;
    const username = client.handshake.auth.username || 'anonymous';
    const savedMessage = await this.chatService.create(message, username, room);
    this.server.to(room).emit('chat message', { message, username });
  }

  async handleConnection(client: Socket) {
    let { room } = client.handshake.query;

    if (Array.isArray(room)) {
      room = room[0]; // Tomar la primera sala si hay varias
    }

    client.join(room);
    const messages = await this.chatService.findAll(room);
    messages.forEach((message) => {
      client.emit('chat message', { message: message.content, username: message.user });
    });
  }
}
