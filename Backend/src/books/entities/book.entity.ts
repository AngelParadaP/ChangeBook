import { Comentario } from 'src/comentarios/entities/comentario.entity';
import { User } from 'src/users/entities';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  idLibro: string;

  @Column({ nullable: false })
  titulo: string;

  @Column({ nullable: false })
  isbn: string;

  @Column({ nullable: false })
  ano_de_publicacion: string;

  @Column({ nullable: false })
  editorial: string;

  @Column({ nullable: false })
  autor: string;

  @Column({ nullable: false })
  sinopsis: string;

  @Column({ default: 'none' })
  imagen: string;

  @Column({ default: 0, type: 'real' })
  calificacion: number;

  @Column({ default: 0 })
  intercambios: number;

  @Column({ default: true })
  disponible: boolean;

  @ManyToOne(() => User, (user) => user.libros)
  user: User;

  @OneToMany(() => Comentario, (coment) => coment.book)
  coments: Comentario[];
}