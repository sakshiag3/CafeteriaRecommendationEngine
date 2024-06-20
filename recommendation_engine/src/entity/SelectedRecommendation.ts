import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column } from 'typeorm';
import { Recommendation } from './Recommendation';

@Entity()
export class SelectedRecommendation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Recommendation)
  recommendation!: Recommendation;

  @Column()
  meal!: string;

  @CreateDateColumn()
  date!: Date;
}
