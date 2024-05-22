// src/chat/chat.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(content: string, user: string, room: string): Promise<Message> {
    const message = this.messagesRepository.create({ content, user, room });
    return this.messagesRepository.save(message);
  }

  async findAll(room: string): Promise<Message[]> {
    return this.messagesRepository.find({ where: { room } });
  }
}
