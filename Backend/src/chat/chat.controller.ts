// src/chat/chat.controller.ts

import { Controller, Post, Body, Get, Query, Patch } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async postMessage(
    @Body('message') message: string,
    @Body('username') username: string,
    @Body('room') room: string,
  ) {
    const savedMessage = await this.chatService.create(message, username, room);
    return { id: savedMessage.id, message: savedMessage.content, username: savedMessage.user, room: savedMessage.room };
  }

  @Get('messages')
  async getMessages(@Query('room') room: string) {
    const messages = await this.chatService.findAll(room);
    return messages;
  }

  @Get('rooms')
  async getRooms(@Query('codigoUsuario') codigoUsuario: string) {
    const rooms = await this.chatService.findRoomsByUser(codigoUsuario);
    return rooms;
  }

  @Get('new-messages')
  async getNewMessages(@Query('codigoUsuario') codigoUsuario: string) {
    const newMessages = await this.chatService.checkNewMessages(codigoUsuario);
    return newMessages;
  }

  @Patch('mark-as-read')
  async markMessagesAsRead(@Query('room') room: string, @Query('codigoUsuario') codigoUsuario: string) {
    await this.chatService.markMessagesAsRead(room, codigoUsuario);
    return { success: true };
  }

}
