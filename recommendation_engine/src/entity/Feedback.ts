import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { MenuItem } from './MenuItem';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => MenuItem)
  menuItem!: MenuItem;

  @Column()
  rating!: number;

  @Column()
  comment!: string;

  @CreateDateColumn()
  date!: Date;
}
