// src/chat/chat.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(content: string, user: string, room: string): Promise<Message> {
    const message = this.messagesRepository.create({ content, user, room, isNew: true });
    return this.messagesRepository.save(message);
  }

  async findAll(room: string): Promise<Message[]> {
    return this.messagesRepository.find({ where: { room } });
  }

  async findRoomsByUser(codigoUsuario: string): Promise<string[]> {
    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .select('message.room')
      .groupBy('message.room')
      .getRawMany();

    return messages
      .map(msg => msg.message_room)
      .filter(room => room.split('-').includes(codigoUsuario));
  }

  async checkNewMessages(codigoUsuario: string): Promise<{ [room: string]: boolean }> {
    const rooms = await this.findRoomsByUser(codigoUsuario);
    const newMessages = {};

    for (const room of rooms) {
      const messages = await this.messagesRepository.find({
        where: { room, user: Not(codigoUsuario), isNew: true },
      });

      newMessages[room] = messages.length > 0;
    }

    return newMessages;
  }

  async markMessagesAsRead(room: string, codigoUsuario: string): Promise<void> {
    await this.messagesRepository.update(
      { room, user: Not(codigoUsuario), isNew: true },
      { isNew: false },
    );
  }
}

