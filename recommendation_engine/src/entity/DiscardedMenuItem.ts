import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity()
export class DiscardedMenuItem {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => MenuItem, { eager: true })
  menuItem!: MenuItem;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  expiresAt!: Date;
}
