import WebSocket from 'ws';
import { MenuItemController } from '../controllers/menuItemController';
import { getMenuItemIdByDisplayId } from './showMenuItems';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';

let newMenuItemDetails: { id?: number, name?: string, description?: string, price?: string, category?: string } = {};
let updateMenuItemDetails: { id?: number, description?: string, price?: string, category?: string } = {};
let deleteMenuItemDetails: { id?: number } = {};

export async function handleMenuItemInputs(
  ws: WebSocket,
  msg: string,
  state: string,
  menuItemController: MenuItemController,
  userService: UserService,
  roleService: RoleService,
  currentStateSetter: (state: string) => void
) {
  console.log(`handleMenuItemInputs: state = ${state}, msg = ${msg}`);

  if (state.startsWith('addMenuItem')) {
    if (state === 'addMenuItemDetails') {
      const [name, description, price, category] = msg.split(',');

      if (!name || !description || !price || !category) {
        ws.send('Error: Please provide all details in the format "name, description, price, category".');
        return;
      }

      const existingMenuItem = await menuItemController.findByName(name);
      if (existingMenuItem) {
        ws.send(`Error: Menu item with name ${name} already exists. Please enter a different name:`);
      } else {
        const categoryEntity = await menuItemController.findCategoryByName(category);
        if (!categoryEntity) {
          const categories = await menuItemController.getCategories();
          ws.send(`Error: Category ${category} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
        } else {
          await menuItemController.handleAddMenuItem({
            name,
            description,
            price,
            category
          });
          ws.send(`Menu item ${name} added successfully.`);

          const chefRole = await roleService.getRoleByName('Chef');
          if (chefRole) {
            await userService.createNotification(
              `New menu item added: ${name}`,
              chefRole.id
            );
            ws.send('Notification sent to Chef role.');
          }

          currentStateSetter('authenticated');
        }
      }
    }
  } else if (state.startsWith('deleteMenuItem')) {
    if (state === 'deleteMenuItemStart') {
      ws.send('Please enter the ID of the menu item to delete:');
      currentStateSetter('deleteMenuItemId');
    } else if (state === 'deleteMenuItemId') {
      const id = parseInt(msg, 10); // Convert msg to a number
      if (isNaN(id)) {
        ws.send('Invalid ID. Please enter a valid numeric ID.');
        return;
      }
      const existingMenuItem = await menuItemController.findById(id);
      if (!existingMenuItem) {
        ws.send(`Error: Menu item with ID ${id} does not exist. Please enter a valid ID.`);
      } else {
        await menuItemController.handleDeleteMenuItem(id);
        ws.send(`Menu item with ID ${id} deleted successfully.`);
        currentStateSetter('authenticated');
      }
    }
  } else if (state.startsWith('updateMenuItem')) {
    if (state === 'updateMenuItemStart') {
      ws.send('Please enter the ID of the menu item to update:');
      currentStateSetter('updateMenuItemId');
    } else if (state === 'updateMenuItemId') {
      const id = parseInt(msg, 10); // Convert msg to a number
      if (isNaN(id)) {
        ws.send('Invalid ID. Please enter a valid numeric ID.');
        return;
      }
      const existingMenuItem = await menuItemController.findById(id);
      if (!existingMenuItem) {
        ws.send(`Error: Menu item with ID ${id} does not exist. Please enter a valid ID.`);
      } else {
        updateMenuItemDetails.id = id;
        ws.send(`Enter new description for the menu item (or press enter to skip):`);
        currentStateSetter('updateMenuItemDescription');
      }
    } else if (state === 'updateMenuItemDescription') {
      updateMenuItemDetails.description = msg || undefined;
      ws.send(`Enter new price for the menu item (or press enter to skip):`);
      currentStateSetter('updateMenuItemPrice');
    } else if (state === 'updateMenuItemPrice') {
      updateMenuItemDetails.price = msg || undefined;
      const categories = await menuItemController.getCategories();
      ws.send(`Enter new category for the menu item (or press enter to skip). Available categories: ${categories.map(category => category.name).join(', ')}:`);
      currentStateSetter('updateMenuItemCategory');
    } else if (state === 'updateMenuItemCategory') {
      const category = await menuItemController.findCategoryByName(msg);
      if (!category && msg) {
        const categories = await menuItemController.getCategories();
        ws.send(`Error: Category ${msg} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
      } else {
        updateMenuItemDetails.category = msg || undefined;
        await menuItemController.handleUpdateMenuItem(updateMenuItemDetails.id!, {
          description: updateMenuItemDetails.description,
          price: updateMenuItemDetails.price,
          category: updateMenuItemDetails.category
        });
        ws.send(`Menu item updated successfully.`);
        updateMenuItemDetails = {};
        currentStateSetter('authenticated');
      }
    }
  }
}
