import { MenuItemService } from '../services/menuItemService';
import { WebSocket } from 'ws';
import { MenuItem } from '../entity/MenuItem';


let menuItemsCache: MenuItem[] = [];
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

  async showMenuItems(ws: WebSocket, menuItemService: MenuItemService) {
    const menuItems: MenuItem[] = await menuItemService.getMenuItems();
    menuItemsCache = menuItems;
    let menuItemTable = 'Menu Items:\n';
    menuItemTable += '+----+-----------------+--------------------+-------+----------------+------------+\n';
    menuItemTable += '| ID | Name            | Description        | Price | Category       | Available  |\n';
    menuItemTable += '+----+-----------------+--------------------+-------+----------------+------------+\n';
    menuItems.forEach((menuItem: MenuItem) => {
      const availabilityStatus = menuItem.availabilityStatus ? 'Yes' : 'No';
      menuItemTable += `| ${String(menuItem.id).padEnd(2)} | ${menuItem.name.padEnd(15)} | ${menuItem.description.padEnd(18)} | ${String(menuItem.price).padEnd(5)} | ${menuItem.category.name.padEnd(14)} | ${availabilityStatus.padEnd(10)} |\n`;
    });
    menuItemTable += '+----+-----------------+--------------------+-------+----------------+------------+\n';
    ws.send(menuItemTable);
  }
}
