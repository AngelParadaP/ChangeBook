import { User } from 'src/users/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  idReporte: string;

  @CreateDateColumn({ nullable: false })
  fecha: Date;

  @Column({ nullable: false })
  descripcion: string;

  @Column({ nullable: false })
  codigo_remitente: string;

  @Column({ default: false })
  resuelto: boolean;

  @ManyToOne(() => User, (user) => user.reportes)
  user: User;
}