// src/chat/entities/message.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  user: string;

  @Column()
  room: string;  // Nuevo campo para la sala
}
