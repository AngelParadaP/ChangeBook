import { Book } from 'src/books/entities/book.entity';
import { Credenciales } from 'src/credenciales/entities';
import { Notification } from 'src/notificaciones/entities/notificaciones.entity';
import { Report } from 'src/reportes/entities/reportes.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ nullable: false })
  codigo: string;

  @Column({ nullable: false })
  nombre: string;

  @Column({ default: 0 })
  strikes: number;

  @Column({ nullable: false, default: '' })
  imagenCredencial: string;

  @Column({ default: null })
  imagenPerfil: string;

  @CreateDateColumn({ nullable: false })
  creadoEn: Date;

  @UpdateDateColumn({ nullable: false })
  actualizadoEn: Date;

  @OneToOne(() => Credenciales, (credencial) => credencial.user, {
    cascade: true,
  })
  @JoinColumn({ name: 'codigo' })
  credenciales: Credenciales;

  //implementar relacion con libros
  @OneToMany(() => Book, (book) => book.user)
  libros: Book[];

  @OneToMany(() => Report, (report) => report.user)
  reportes: Report[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notificaciones: Notification[];
}
