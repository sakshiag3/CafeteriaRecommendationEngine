import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity()
export class FoodCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => MenuItem, menuItem => menuItem.category)
  menuItems!: MenuItem[];
}
