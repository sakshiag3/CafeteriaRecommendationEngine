import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FoodCategory } from './FoodCategory';

@Entity()
export class MenuItem {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column('decimal')
  price!: number;

  @ManyToOne(() => FoodCategory, { eager: true })
  category!: FoodCategory;

  @Column({ default: true })
  availabilityStatus!: boolean;

  @Column({ type: 'enum', enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'], default: 'Vegetarian' })
  dietaryRestriction!: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';

  @Column({ type: 'enum', enum: ['High', 'Medium', 'Low'], default: 'Medium' })
  spiceLevel!: 'High' | 'Medium' | 'Low';

  @Column({ type: 'enum', enum: ['North Indian', 'South Indian', 'Other'], default: 'Other' })
  regionalPreference!: 'North Indian' | 'South Indian' | 'Other';

  @Column({ default: false })
  isSweet!: boolean;
}
