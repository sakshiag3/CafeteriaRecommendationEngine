import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Role } from './Role';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  content!: string;

  @Column()
  expiryDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Role)
  role!: Role;
}
