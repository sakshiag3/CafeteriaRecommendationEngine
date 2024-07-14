import { MenuItem } from '../entity/MenuItem';
import { MenuItemRepository } from '../repositories/menuItemRepository';
import { MenuItemDetails } from '../Interface/ MenuItemDetails';
import { UpdateMenuItemDetails } from '../Interface/updateRequest';
export class MenuItemService {
  private menuItemRepository: MenuItemRepository;

  constructor() {
    this.menuItemRepository = new MenuItemRepository();
  }

  async addMenuItem(details: MenuItemDetails) {
    try {
      const {
        name,
        description,
        price,
        category,
        availabilityStatus = true,
        dietaryRestriction,
        spiceLevel,
        regionalPreference,
        isSweet = false,
      } = details;

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
        isSweet,
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw new Error('An error occurred while adding the menu item. Please try again later.');
    }
  }

  async updateMenuItem(id: number, updates: UpdateMenuItemDetails) {
    try {
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
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw new Error('An error occurred while updating the menu item. Please try again later.');
    }
  }

  async deleteMenuItem(id: number) {
    try {
      const existingMenuItem = await this.menuItemRepository.findById(id);
      if (!existingMenuItem) throw new Error('MenuItem not found');

      await this.menuItemRepository.delete(existingMenuItem);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw new Error('An error occurred while deleting the menu item. Please try again later.');
    }
  }

  async findByName(name: string) {
    try {
      return await this.menuItemRepository.findByName(name);
    } catch (error) {
      console.error('Error finding menu item by name:', error);
      throw new Error('An error occurred while finding the menu item by name. Please try again later.');
    }
  }

  async findById(id: number) {
    try {
      return await this.menuItemRepository.findById(id);
    } catch (error) {
      console.error('Error finding menu item by ID:', error);
      throw new Error('An error occurred while finding the menu item by ID. Please try again later.');
    }
  }

  async getCategories() {
    try {
      return await this.menuItemRepository.findCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('An error occurred while fetching categories. Please try again later.');
    }
  }

  async findCategoryByName(name: string) {
    try {
      return await this.menuItemRepository.findCategoryByName(name);
    } catch (error) {
      console.error('Error finding category by name:', error);
      throw new Error('An error occurred while finding the category by name. Please try again later.');
    }
  }

  async getMenuItems() {
    try {
      return await this.menuItemRepository.findMenuItems();
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw new Error('An error occurred while fetching menu items. Please try again later.');
    }
  }
}
