import { MenuItemService } from '../services/menuItemService';

export class MenuItemController {
  constructor(private menuItemService: MenuItemService) {}

  async handleAddMenuItem(menuItemData: { name: string; description: string; price: string; category: string; availabilityStatus?: boolean }) {
    const { name, description, price, category, availabilityStatus } = menuItemData;
    await this.menuItemService.addMenuItem(name, description, price, category, availabilityStatus);
  }

  async handleUpdateMenuItem(id: number, updates: { description?: string; price?: string; category?: string; availabilityStatus?: boolean }) {
    await this.menuItemService.updateMenuItem(id, updates);
  }

  async handleDeleteMenuItem(id: number) {
    await this.menuItemService.deleteMenuItem(id);
  }

  async findByName(name: string) {
    return this.menuItemService.findByName(name);
  }

  async findById(id: number) {
    return this.menuItemService.findById(id);
  }

  async getCategories() {
    return this.menuItemService.getCategories();
  }

  async findCategoryByName(name: string) {
    return this.menuItemService.findCategoryByName(name);
  }

  async getMenuItems() {
    return this.menuItemService.getMenuItems();
  }
}
