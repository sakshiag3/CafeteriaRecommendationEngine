import WebSocket from 'ws';
import { MenuItemController } from '../controllers/menuItemController';
import { getMenuItemIdByDisplayId } from './showMenuItems';

let newMenuItemDetails: { id?: number, name?: string, description?: string, price?: string, category?: string } = {};
let updateMenuItemDetails: { id?: number, description?: string, price?: string, category?: string } = {};
let deleteMenuItemDetails: { id?: number } = {};

export async function handleMenuItemInputs(
  ws: WebSocket,
  msg: string,
  state: string,
  menuItemController: MenuItemController,
  currentStateSetter: (state: string) => void
) {
  console.log(`handleMenuItemInputs: state = ${state}, msg = ${msg}`);

  if (state.startsWith('addMenuItem')) {
    if (state === 'addMenuItemStart') {
      ws.send('Please enter the name of the new menu item:');
      currentStateSetter('addMenuItemName');
    } else if (state === 'addMenuItemName') {
      const existingMenuItem = await menuItemController.findByName(msg);
      console.log(`Existing menu item: ${existingMenuItem}`);
      if (existingMenuItem) {
        ws.send(`Error: Menu item with name ${msg} already exists. Please enter a different name:`);
      } else {
        newMenuItemDetails.name = msg;
        ws.send(`Enter description for the menu item ${newMenuItemDetails.name}:`);
        currentStateSetter('addMenuItemDescription');
      }
    } else if (state === 'addMenuItemDescription') {
      newMenuItemDetails.description = msg;
      ws.send(`Enter price for the menu item ${newMenuItemDetails.name}:`);
      currentStateSetter('addMenuItemPrice');
    } else if (state === 'addMenuItemPrice') {
      newMenuItemDetails.price = msg;
      const categories = await menuItemController.getCategories();
      ws.send(`Enter category for the menu item ${newMenuItemDetails.name}. Available categories: ${categories.map(category => category.name).join(', ')}:`);
      currentStateSetter('addMenuItemCategory');
    } else if (state === 'addMenuItemCategory') {
      const category = await menuItemController.findCategoryByName(msg);
      if (!category) {
        const categories = await menuItemController.getCategories();
        ws.send(`Error: Category ${msg} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
      } else {
        newMenuItemDetails.category = msg;
        await menuItemController.handleAddMenuItem({
          name: newMenuItemDetails.name!,
          description: newMenuItemDetails.description!,
          price: newMenuItemDetails.price!,
          category: newMenuItemDetails.category!
        });
        ws.send(`Menu item ${newMenuItemDetails.name} added successfully.`);
        newMenuItemDetails = {};
        currentStateSetter('authenticated');
      }
    }
  } else if (state.startsWith('deleteMenuItem')) {
    if (state === 'deleteMenuItemStart') {
      ws.send('Please enter the ID of the menu item to delete:');
      currentStateSetter('deleteMenuItemId');
    } else if (state === 'deleteMenuItemId') {
      const displayId = parseInt(msg, 10); // Convert msg to a number
      if (isNaN(displayId)) {
        ws.send('Invalid ID. Please enter a valid numeric ID.');
        return;
      }
      const id = getMenuItemIdByDisplayId(displayId);
      if (id === undefined) {
        ws.send(`Error: Menu item with ID ${displayId} does not exist. Please enter a valid ID.`);
      } else {
        const existingMenuItem = await menuItemController.findById(id);
        console.log(`Existing menu item: ${existingMenuItem}`);
        if (!existingMenuItem) {
          ws.send(`Error: Menu item with ID ${displayId} does not exist. Please enter a valid ID.`);
        } else {
          await menuItemController.handleDeleteMenuItem(id);
          ws.send(`Menu item with ID ${displayId} deleted successfully.`);
          deleteMenuItemDetails = {};
          currentStateSetter('authenticated');
        }
      }
    }
  } else if (state.startsWith('updateMenuItem')) {
    if (state === 'updateMenuItemStart') {
      ws.send('Please enter the ID of the menu item to update:');
      currentStateSetter('updateMenuItemId');
    } else if (state === 'updateMenuItemId') {
      const displayId = parseInt(msg, 10); // Convert msg to a number
      if (isNaN(displayId)) {
        ws.send('Invalid ID. Please enter a valid numeric ID.');
        return;
      }
      const id = getMenuItemIdByDisplayId(displayId);
      if (id === undefined) {
        ws.send(`Error: Menu item with ID ${displayId} does not exist. Please enter a valid ID.`);
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
