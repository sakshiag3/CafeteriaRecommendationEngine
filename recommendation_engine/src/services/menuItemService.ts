import { MenuItem } from '../entity/MenuItem'; // Add this import
import { MenuItemRepository } from '../repositories/menuItemRepository';

export class MenuItemService {

  private menuItemRepository: MenuItemRepository;
  constructor() { 
    this.menuItemRepository = new MenuItemRepository();
  }

  async addMenuItem(name: string, description: string, price: string, category: string, availabilityStatus: boolean = true, dietaryRestriction: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian', spiceLevel: 'High' | 'Medium' | 'Low', regionalPreference: 'North Indian' | 'South Indian' | 'Other', isSweet: boolean = false) {
    const categoryEntity = await this.menuItemRepository.findCategoryByName(category);
    if (!categoryEntity) throw new Error('Category not found');

    await this.menuItemRepository.save({
      name,
      description,
      price: parseFloat(price),
      category: categoryEntity,
      availabilityStatus,
      dietaryRestriction,
      spiceLevel,
      regionalPreference,
      isSweet
    });
  }

  async updateMenuItem(id: number, updates: { description?: string; price?: string; category?: string; availabilityStatus?: boolean; dietaryRestriction?: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian'; spiceLevel?: 'High' | 'Medium' | 'Low'; regionalPreference?: 'North Indian' | 'South Indian' | 'Other'; isSweet?: boolean }) {
    const existingMenuItem = await this.menuItemRepository.findById(id);
    if (!existingMenuItem) throw new Error('MenuItem not found');

    const updateData: Partial<MenuItem> = {};

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.price !== undefined) {
      updateData.price = parseFloat(updates.price);
    }
    if (updates.category !== undefined) {
      const categoryEntity = await this.menuItemRepository.findCategoryByName(updates.category);
      if (!categoryEntity) throw new Error('Category not found');
      updateData.category = categoryEntity;
    }
    if (updates.availabilityStatus !== undefined) {
      updateData.availabilityStatus = updates.availabilityStatus;
    }
    if (updates.dietaryRestriction !== undefined) {
      updateData.dietaryRestriction = updates.dietaryRestriction;
    }
    if (updates.spiceLevel !== undefined) {
      updateData.spiceLevel = updates.spiceLevel;
    }
    if (updates.regionalPreference !== undefined) {
      updateData.regionalPreference = updates.regionalPreference;
    }
    if (updates.isSweet !== undefined) {
      updateData.isSweet = updates.isSweet;
    }

    await this.menuItemRepository.update(id, updateData);
  }

  async deleteMenuItem(id: number) {
    const existingMenuItem = await this.menuItemRepository.findById(id);
    if (!existingMenuItem) throw new Error('MenuItem not found');

    await this.menuItemRepository.delete(existingMenuItem);
  }

  async findByName(name: string) {
    return this.menuItemRepository.findByName(name);
  }

  async findById(id: number) {
    return this.menuItemRepository.findById(id);
  }

  async getCategories() {
    return this.menuItemRepository.findCategories();
  }

  async findCategoryByName(name: string) {
    return this.menuItemRepository.findCategoryByName(name);
  }

  async getMenuItems() {
    return this.menuItemRepository.findMenuItems();
  }
}
