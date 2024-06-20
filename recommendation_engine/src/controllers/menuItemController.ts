import { menuItem } from '../Interface/menuItemRequest';
import { updateMenuItem } from '../Interface/updateRequest';
import { MenuItemService } from '../services/menuItemService';

export class MenuItemController {
  constructor(private menuItemService: MenuItemService) {}

  async handleAddMenuItem(menuItemData: menuItem) {
    const { name, description, price, category } = menuItemData;
    console.log(`Adding menu item: ${name}`);
    await this.menuItemService.addMenuItem(name, description, price, category);
  }

  async handleUpdateMenuItem(id: number, updates: updateMenuItem) {
    console.log(`Updating menu item: ${id}`);
    await this.menuItemService.updateMenuItem(id, updates);
  }

  async handleDeleteMenuItem(id: number) {
    console.log(`Deleting menu item with ID: ${id}`);
    await this.menuItemService.deleteMenuItem(id);
  }

  async findById(id: number) {
    console.log(`Finding menu item by ID: ${id}`);
    return this.menuItemService.findById(id);
  }

  async findByName(name: string) {
    console.log(`Finding menu item by name: ${name}`);
    return this.menuItemService.findByName(name);
  }

  async getCategories() {
    console.log('Getting categories');
    return this.menuItemService.getCategories();
  }

  async findCategoryByName(name: string) {
    console.log(`Finding category by name: ${name}`);
    return this.menuItemService.findCategoryByName(name);
  }

  async getMenuItems() {
    console.log('Getting menu items');
    return this.menuItemService.getMenuItems();
  }
}
