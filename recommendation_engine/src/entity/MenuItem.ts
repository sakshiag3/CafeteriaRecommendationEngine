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
}
