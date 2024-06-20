import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column } from 'typeorm';
import { SelectedRecommendation } from './SelectedRecommendation';

@Entity()
export class FinalSelection {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SelectedRecommendation)
  selectedRecommendation!: SelectedRecommendation;

  @Column()
  meal!: string;

  @CreateDateColumn()
  date!: Date;
}
