// src/chat/chat.controller.ts

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
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
}
