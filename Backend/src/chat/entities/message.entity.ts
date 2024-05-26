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
  room: string;

  @Column({ default: true }) // Nuevo campo para indicar si el mensaje es nuevo
  isNew: boolean;
}

