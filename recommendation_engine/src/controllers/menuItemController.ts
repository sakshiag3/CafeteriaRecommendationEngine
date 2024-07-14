import { MenuItemService } from '../services/menuItemService';
import { WebSocket } from 'ws';
import { MenuItem } from '../entity/MenuItem';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';

let menuItemsCache: MenuItem[] = [];
let updateMenuItemDetails: { id?: number; description?: string; price?: string; category?: string; availabilityStatus?: boolean; dietaryRestriction?: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian'; spiceLevel?: 'High' | 'Medium' | 'Low'; regionalPreference?: 'North Indian' | 'South Indian' | 'Other'; isSweet?: boolean } = {};

export class MenuItemController {
  private menuItemService: MenuItemService;
  private userService: UserService;
  private roleService: RoleService;

  constructor() {
    this.menuItemService = new MenuItemService();
    this.userService = new UserService();
    this.roleService = new RoleService();
  }

  async showMenuItems(ws: WebSocket) {
    const menuItems: MenuItem[] = await this.menuItemService.getMenuItems();
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

  async handleAddMenuItem(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    const [name, description, price, category, availabilityStatus, dietaryRestriction, spiceLevel, regionalPreference, isSweet] = msg.split(',');

    if (!name || !description || !price || !category || availabilityStatus === undefined || !dietaryRestriction || !spiceLevel || !regionalPreference || isSweet === undefined) {
      ws.send('Error: Please provide all details in the format "name, description, price, category, availabilityStatus, dietaryRestriction, spiceLevel, regionalPreference, isSweet".');
      return;
    }

    const validDietaryRestrictions = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'];
    const validSpiceLevels = ['High', 'Medium', 'Low'];
    const validRegionalPreferences = ['North Indian', 'South Indian', 'Other'];

    if (!validDietaryRestrictions.includes(dietaryRestriction)) {
      ws.send(`Error: Invalid dietary restriction. Valid values are: ${validDietaryRestrictions.join(', ')}.`);
      return;
    }

    if (!validSpiceLevels.includes(spiceLevel)) {
      ws.send(`Error: Invalid spice level. Valid values are: ${validSpiceLevels.join(', ')}.`);
      return;
    }

    if (!validRegionalPreferences.includes(regionalPreference)) {
      ws.send(`Error: Invalid regional preference. Valid values are: ${validRegionalPreferences.join(', ')}.`);
      return;
    }

    const existingMenuItem = await this.menuItemService.findByName(name);
    if (existingMenuItem) {
      ws.send(`Error: Menu item with name ${name} already exists. Please enter a different name:`);
    } else {
      const categoryEntity = await this.menuItemService.findCategoryByName(category);
      if (!categoryEntity) {
        const categories = await this.menuItemService.getCategories();
        ws.send(`Error: Category ${category} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
      } else {
        await this.menuItemService.addMenuItem(
          name,
          description,
          price,
          category,
          availabilityStatus.toLowerCase() === 'true',
          dietaryRestriction as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian',
          spiceLevel as 'High' | 'Medium' | 'Low',
          regionalPreference as 'North Indian' | 'South Indian' | 'Other',
          isSweet.toLowerCase() === 'true'
        );
        ws.send(`Menu item ${name} added successfully.`);

        const chefRole = await this.roleService.getRoleByName('Chef');
        if (chefRole) {
          await this.userService.createNotification(`New menu item added: ${name}`, chefRole.id);
          ws.send('Notification sent to Chef role.');
        }

        currentStateSetter('authenticated');
      }
    }
  }

  async handleDeleteMenuItem(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    const id = parseInt(msg, 10); // Convert msg to a number
    if (isNaN(id)) {
      ws.send('Invalid ID. Please enter a valid numeric ID.');
      return;
    }
    const existingMenuItem = await this.menuItemService.findById(id);
    if (!existingMenuItem) {
      ws.send(`Error: Menu item with ID ${id} does not exist. Please enter a valid ID.`);
    } else {
      await this.menuItemService.deleteMenuItem(id);
      ws.send(`Menu item with ID ${id} deleted successfully.`);
      currentStateSetter('authenticated');
    }
  }

  async handleUpdateMenuItem(ws: WebSocket, msg: string, state: string, currentStateSetter: (state: string) => void) {
    switch (state) {
      case 'updateMenuItemStart':
        ws.send('Please enter the ID of the menu item to update:');
        currentStateSetter('updateMenuItemId');
        break;
      case 'updateMenuItemId':
        await this.handleUpdateMenuItemIdState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemDescription':
        await this.handleUpdateMenuItemDescriptionState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemPrice':
        await this.handleUpdateMenuItemPriceState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemCategory':
        await this.handleUpdateMenuItemCategoryState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemAvailabilityStatus':
        await this.handleUpdateMenuItemAvailabilityStatusState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemDietaryRestriction':
        await this.handleUpdateMenuItemDietaryRestrictionState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemSpiceLevel':
        await this.handleUpdateMenuItemSpiceLevelState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemRegionalPreference':
        await this.handleUpdateMenuItemRegionalPreferenceState(ws, msg, currentStateSetter);
        break;
      case 'updateMenuItemIsSweet':
        await this.handleUpdateMenuItemIsSweetState(ws, msg, currentStateSetter);
        break;
      default:
        ws.send('Invalid state. Please try again.');
        break;
    }
  }

  private async handleUpdateMenuItemIdState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    const id = parseInt(msg, 10); // Convert msg to a number
    if (isNaN(id)) {
      ws.send('Invalid ID. Please enter a valid numeric ID.');
      return;
    }
    const existingMenuItem = await this.menuItemService.findById(id);
    if (!existingMenuItem) {
      ws.send(`Error: Menu item with ID ${id} does not exist. Please enter a valid ID.`);
    } else {
      updateMenuItemDetails.id = id;
      ws.send(`Enter new description for the menu item (or press enter to skip):`);
      currentStateSetter('updateMenuItemDescription');
    }
  }

  private async handleUpdateMenuItemDescriptionState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.description = msg || undefined;
    ws.send(`Enter new price for the menu item (or press enter to skip):`);
    currentStateSetter('updateMenuItemPrice');
  }

  private async handleUpdateMenuItemPriceState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.price = msg || undefined;
    const categories = await this.menuItemService.getCategories();
    ws.send(`Enter new category for the menu item (or press enter to skip). Available categories: ${categories.map(category => category.name).join(', ')}:`);
    currentStateSetter('updateMenuItemCategory');
  }

  private async handleUpdateMenuItemCategoryState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    const category = await this.menuItemService.findCategoryByName(msg);
    if (!category && msg) {
      const categories = await this.menuItemService.getCategories();
      ws.send(`Error: Category ${msg} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
    } else {
      updateMenuItemDetails.category = msg || undefined;
      ws.send(`Enter new availability status for the menu item (true or false, or press enter to skip):`);
      currentStateSetter('updateMenuItemAvailabilityStatus');
    }
  }

  private async handleUpdateMenuItemAvailabilityStatusState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.availabilityStatus = msg.toLowerCase() === 'true' || msg.toLowerCase() === 'false' ? msg.toLowerCase() === 'true' : undefined;
    ws.send(`Enter new dietary restriction for the menu item (Vegetarian, Non-Vegetarian, Eggetarian, or press enter to skip):`);
    currentStateSetter('updateMenuItemDietaryRestriction');
  }

  private async handleUpdateMenuItemDietaryRestrictionState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.dietaryRestriction = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'].includes(msg) ? msg as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' : undefined;
    ws.send(`Enter new spice level for the menu item (High, Medium, Low, or press enter to skip):`);
    currentStateSetter('updateMenuItemSpiceLevel');
  }

  private async handleUpdateMenuItemSpiceLevelState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.spiceLevel = ['High', 'Medium', 'Low'].includes(msg) ? msg as 'High' | 'Medium' | 'Low' : undefined;
    ws.send(`Enter new regional preference for the menu item (North Indian, South Indian, Other, or press enter to skip):`);
    currentStateSetter('updateMenuItemRegionalPreference');
  }

  private async handleUpdateMenuItemRegionalPreferenceState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.regionalPreference = ['North Indian', 'South Indian', 'Other'].includes(msg) ? msg as 'North Indian' | 'South Indian' | 'Other' : undefined;
    ws.send(`Enter if the menu item is sweet (true or false, or press enter to skip):`);
    currentStateSetter('updateMenuItemIsSweet');
  }

  private async handleUpdateMenuItemIsSweetState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    updateMenuItemDetails.isSweet = msg.toLowerCase() === 'true' || msg.toLowerCase() === 'false' ? msg.toLowerCase() === 'true' : undefined;
    await this.menuItemService.updateMenuItem(updateMenuItemDetails.id!, updateMenuItemDetails);
    ws.send(`Menu item updated successfully.`);
    updateMenuItemDetails = {};
    currentStateSetter('authenticated');
  }
}
