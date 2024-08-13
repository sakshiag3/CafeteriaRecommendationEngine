import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity()
export class SentimentScore {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => MenuItem)
  menuItem!: MenuItem;

  @Column('float')
  score!: number;

  @Column()
  date!: Date;
}
