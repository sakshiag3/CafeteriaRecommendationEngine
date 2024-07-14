import { MenuItemService } from '../services/menuItemService';
import { WebSocket } from 'ws';
import { MenuItem } from '../entity/MenuItem';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { UpdateMenuItemDetails } from '../Interface/updateRequest';
import { MenuItemDetails } from '../Interface/ MenuItemDetails';


let menuItemsCache: MenuItem[] = [];
let updateMenuItemDetails: UpdateMenuItemDetails = {};

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
    try {
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
    } catch (error) {
      console.error('Error showing menu items:', error);
      ws.send('An error occurred while fetching menu items. Please try again later.');
    }
  }

  async handleAddMenuItem(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
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
          const menuItemDetails: MenuItemDetails = {
            name,
            description,
            price,
            category,
            availabilityStatus: availabilityStatus.toLowerCase() === 'true',
            dietaryRestriction: dietaryRestriction as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian',
            spiceLevel: spiceLevel as 'High' | 'Medium' | 'Low',
            regionalPreference: regionalPreference as 'North Indian' | 'South Indian' | 'Other',
            isSweet: isSweet.toLowerCase() === 'true',
          };

          await this.menuItemService.addMenuItem(menuItemDetails);
          ws.send(`Menu item ${name} added successfully.`);

          const chefRole = await this.roleService.getRoleByName('Chef');
          if (chefRole) {
            await this.userService.createNotification(`New menu item added: ${name}`, chefRole.id);
            ws.send('Notification sent to Chef role.');
          }

          currentStateSetter('authenticated');
        }
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      ws.send('An error occurred while adding the menu item. Please try again later.');
    }
  }

  async handleDeleteMenuItem(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
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
    } catch (error) {
      console.error('Error deleting menu item:', error);
      ws.send('An error occurred while deleting the menu item. Please try again later.');
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
    try {
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
    } catch (error) {
      console.error('Error handling update menu item ID:', error);
      ws.send('An error occurred while processing the menu item ID. Please try again later.');
    }
  }

  private async handleUpdateMenuItemDescriptionState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.description = msg || undefined;
      ws.send(`Enter new price for the menu item (or press enter to skip):`);
      currentStateSetter('updateMenuItemPrice');
    } catch (error) {
      console.error('Error handling update menu item description:', error);
      ws.send('An error occurred while processing the menu item description. Please try again later.');
    }
  }

  private async handleUpdateMenuItemPriceState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.price = msg || undefined;
      const categories = await this.menuItemService.getCategories();
      ws.send(`Enter new category for the menu item (or press enter to skip). Available categories: ${categories.map(category => category.name).join(', ')}:`);
      currentStateSetter('updateMenuItemCategory');
    } catch (error) {
      console.error('Error handling update menu item price:', error);
      ws.send('An error occurred while processing the menu item price. Please try again later.');
    }
  }

  private async handleUpdateMenuItemCategoryState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      const category = await this.menuItemService.findCategoryByName(msg);
      if (!category && msg) {
        const categories = await this.menuItemService.getCategories();
        ws.send(`Error: Category ${msg} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
      } else {
        updateMenuItemDetails.category = msg || undefined;
        ws.send(`Enter new availability status for the menu item (true or false, or press enter to skip):`);
        currentStateSetter('updateMenuItemAvailabilityStatus');
      }
    } catch (error) {
      console.error('Error handling update menu item category:', error);
      ws.send('An error occurred while processing the menu item category. Please try again later.');
    }
  }

  private async handleUpdateMenuItemAvailabilityStatusState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.availabilityStatus = msg.toLowerCase() === 'true' || msg.toLowerCase() === 'false' ? msg.toLowerCase() === 'true' : undefined;
      ws.send(`Enter new dietary restriction for the menu item (Vegetarian, Non-Vegetarian, Eggetarian, or press enter to skip):`);
      currentStateSetter('updateMenuItemDietaryRestriction');
    } catch (error) {
      console.error('Error handling update menu item availability status:', error);
      ws.send('An error occurred while processing the menu item availability status. Please try again later.');
    }
  }

  private async handleUpdateMenuItemDietaryRestrictionState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.dietaryRestriction = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'].includes(msg) ? msg as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' : undefined;
      ws.send(`Enter new spice level for the menu item (High, Medium, Low, or press enter to skip):`);
      currentStateSetter('updateMenuItemSpiceLevel');
    } catch (error) {
      console.error('Error handling update menu item dietary restriction:', error);
      ws.send('An error occurred while processing the menu item dietary restriction. Please try again later.');
    }
  }

  private async handleUpdateMenuItemSpiceLevelState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.spiceLevel = ['High', 'Medium', 'Low'].includes(msg) ? msg as 'High' | 'Medium' | 'Low' : undefined;
      ws.send(`Enter new regional preference for the menu item (North Indian, South Indian, Other, or press enter to skip):`);
      currentStateSetter('updateMenuItemRegionalPreference');
    } catch (error) {
      console.error('Error handling update menu item spice level:', error);
      ws.send('An error occurred while processing the menu item spice level. Please try again later.');
    }
  }

  private async handleUpdateMenuItemRegionalPreferenceState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.regionalPreference = ['North Indian', 'South Indian', 'Other'].includes(msg) ? msg as 'North Indian' | 'South Indian' | 'Other' : undefined;
      ws.send(`Enter if the menu item is sweet (true or false, or press enter to skip):`);
      currentStateSetter('updateMenuItemIsSweet');
    } catch (error) {
      console.error('Error handling update menu item regional preference:', error);
      ws.send('An error occurred while processing the menu item regional preference. Please try again later.');
    }
  }

  private async handleUpdateMenuItemIsSweetState(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      updateMenuItemDetails.isSweet = msg.toLowerCase() === 'true' || msg.toLowerCase() === 'false' ? msg.toLowerCase() === 'true' : undefined;
      await this.menuItemService.updateMenuItem(updateMenuItemDetails.id!, updateMenuItemDetails);
      ws.send(`Menu item updated successfully.`);
      updateMenuItemDetails = {};
      currentStateSetter('authenticated');
    } catch (error) {
      console.error('Error handling update menu item is sweet:', error);
      ws.send('An error occurred while updating the menu item. Please try again later.');
    }
  }
}
