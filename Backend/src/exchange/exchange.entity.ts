import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Exchange {
  @PrimaryColumn()
  id: string;

  @Column()
  tituloLibro: string;

  @Column({ default: false })
  aceptado: boolean;

  @Column()
  usuarioReceptor: string;

  @Column({ nullable: true })
  fechaDevolucion: Date;

  @Column({ nullable: true })
  fechaEntrega: Date;

  @Column({ nullable: true })
  lugar: string;

  
}

