import { Book } from 'src/books/entities';
import { User } from 'src/users/entities';
import { Entity, Column, PrimaryColumn, OneToOne, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Comentario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false, default: '' })
    comentario: string;

    @Column({ nullable: false, default: 0 })
    calificacion: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @ManyToOne(() => Book, (book) => book.coments)
    book: Book;
}