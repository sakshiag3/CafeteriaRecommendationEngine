import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column } from 'typeorm';
import { SelectedRecommendation } from './SelectedRecommendation';
import { User } from './User';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SelectedRecommendation)
  selectedRecommendation!: SelectedRecommendation;

  @ManyToOne(() => User)
  user!: User;

  @CreateDateColumn()
  date!: Date;
}
