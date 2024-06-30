import { WebSocket } from 'ws';
import { MenuItemService } from '../services/menuItemService';
import { MenuItem } from '../entity/MenuItem';

let menuItemsCache: MenuItem[] = [];

export async function showMenuItems(ws: WebSocket, menuItemService: MenuItemService) {
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