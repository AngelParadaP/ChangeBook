import { User } from 'src/users/entities';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity('notificaciones')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  idNotificacion: string;

  @Column({ nullable: false })
  mensaje: string;

  @Column({ default: false })
  resuelto: boolean;

  @CreateDateColumn()
  fecha: Date;

  @ManyToOne(() => User, (user) => user.notificaciones)
  user: User;
}
