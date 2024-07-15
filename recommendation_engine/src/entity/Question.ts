import { Entity, PrimaryGeneratedColumn,ManyToOne, Column } from 'typeorm';
import { DiscardedMenuItem } from './DiscardedMenuItem';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => DiscardedMenuItem, { eager: true })
  discardedMenuItem!: DiscardedMenuItem;

  @Column()
  questionText!: string;
}
