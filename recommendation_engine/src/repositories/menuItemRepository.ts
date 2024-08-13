import { Repository } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { FoodCategory } from '../entity/FoodCategory';
import { AppDataSource } from '../data-source';

export class MenuItemRepository {
  private menuItemRepo: Repository<MenuItem>
  private foodCategoryRepo: Repository<FoodCategory>
  constructor() {
    this.menuItemRepo = AppDataSource.getRepository(MenuItem);
    this.foodCategoryRepo = AppDataSource.getRepository(FoodCategory);
 }
 
  async findById(id: number): Promise<MenuItem | null> {
    return this.menuItemRepo.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<MenuItem | null> {
    return this.menuItemRepo.findOne({ where: { name } });
  }

  async findCategories(): Promise<FoodCategory[]> {
    return this.foodCategoryRepo.find();
  }

  async findCategoryByName(name: string): Promise<FoodCategory | null> {
    return this.foodCategoryRepo.findOne({ where: { name } });
  }

  async save(menuItem: Partial<MenuItem>): Promise<void> {
    await this.menuItemRepo.save(menuItem);
  }

  async findMenuItems(): Promise<MenuItem[]> {
    return this.menuItemRepo.find();
  }

  async findMenuItemsByCategory(category: FoodCategory): Promise<MenuItem[]> {
    return this.menuItemRepo.find({ where: { category } });
  }

  async update(id: number, updates: Partial<MenuItem>): Promise<void> {
    await this.menuItemRepo.update(id, updates);
  }

  async delete(menuItem: MenuItem): Promise<void> {
    await this.menuItemRepo.remove(menuItem);
  }
}
