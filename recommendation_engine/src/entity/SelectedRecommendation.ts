import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity()
export class SelectedRecommendation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    meal!: string;
  
    @CreateDateColumn()
    date!: Date;
  
    @ManyToOne(() => MenuItem)
    menuItem!: MenuItem;
}
