import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  idElemento: string;

  @Column({ nullable: false })
  codigoUsuario: string;

  @Column({ nullable: false })
  idDelLibro: string;
}
