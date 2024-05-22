import { User } from 'src/users/entities';
import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm';

@Entity()
export class Credenciales {
  @PrimaryColumn({ nullable: false })
  codigo: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  correo: string;

  @Column({ default: false })
  habilitado: boolean;

  @OneToOne(() => User, (user) => user.credenciales)
  user: User;
}