import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { DiscardedMenuItem } from './DiscardedMenuItem';
import { Question } from './Question';

@Entity()
export class FeedbackForm {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => DiscardedMenuItem, { eager: true })
  discardedMenuItem!: DiscardedMenuItem;

  @ManyToOne(() => Question, { eager: true })
  question!: Question;

  @Column({ type: 'text', nullable: true })
  response?: string;
}
