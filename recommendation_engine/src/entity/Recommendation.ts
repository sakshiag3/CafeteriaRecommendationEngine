import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity()
export class Recommendation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  meal!: string;

  @CreateDateColumn()
  date!: Date;

  @ManyToOne(() => MenuItem)
  menuItem!: MenuItem;
}
