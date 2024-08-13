import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from './Role';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @ManyToOne(() => Role, role => role.users)
  role!: Role;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  logoutTime!: Date;
}
