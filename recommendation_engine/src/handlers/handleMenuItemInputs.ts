import WebSocket from 'ws';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { MenuItemService } from '../services/menuItemService';

let updateMenuItemDetails: { id?: number; description?: string; price?: string; category?: string } = {};

export async function handleMenuItemInputs(
  ws: WebSocket,
  msg: string,
  state: string,
  userService: UserService,
  roleService: RoleService,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  console.log(`handleMenuItemInputs: state = ${state}, msg = ${msg}`);

  if (state.startsWith('addMenuItem')) {
    await handleAddMenuItemStates(ws, msg, state, menuItemService, userService, roleService, currentStateSetter);
  } else if (state.startsWith('deleteMenuItem')) {
    await handleDeleteMenuItemStates(ws, msg, state, menuItemService, currentStateSetter);
  } else if (state.startsWith('updateMenuItem')) {
    await handleUpdateMenuItemStates(ws, msg, state, menuItemService, currentStateSetter);
  } else {
    ws.send('Invalid state. Please try again.');
  }
}

async function handleAddMenuItemStates(
  ws: WebSocket,
  msg: string,
  state: string,
  menuItemService: MenuItemService,
  userService: UserService,
  roleService: RoleService,
  currentStateSetter: (state: string) => void
) {
  if (state === 'addMenuItemDetails') {
    const [name, description, price, category] = msg.split(',');

    if (!name || !description || !price || !category) {
      ws.send('Error: Please provide all details in the format "name, description, price, category".');
      return;
    }

    const existingMenuItem = await menuItemService.findByName(name);
    if (existingMenuItem) {
      ws.send(`Error: Menu item with name ${name} already exists. Please enter a different name:`);
    } else {
      const categoryEntity = await menuItemService.findCategoryByName(category);
      if (!categoryEntity) {
        const categories = await menuItemService.getCategories();
        ws.send(`Error: Category ${category} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
      } else {
        await menuItemService.addMenuItem(name, description, price, category);
        ws.send(`Menu item ${name} added successfully.`);

        const chefRole = await roleService.getRoleByName('Chef');
        if (chefRole) {
          await userService.createNotification(`New menu item added: ${name}`, chefRole.id);
          ws.send('Notification sent to Chef role.');
        }

        currentStateSetter('authenticated');
      }
    }
  }
}

async function handleDeleteMenuItemStates(
  ws: WebSocket,
  msg: string,
  state: string,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  if (state === 'deleteMenuItemStart') {
    ws.send('Please enter the ID of the menu item to delete:');
    currentStateSetter('deleteMenuItemId');
  } else if (state === 'deleteMenuItemId') {
    const id = parseInt(msg, 10); // Convert msg to a number
    if (isNaN(id)) {
      ws.send('Invalid ID. Please enter a valid numeric ID.');
      return;
    }
    const existingMenuItem = await menuItemService.findById(id);
    if (!existingMenuItem) {
      ws.send(`Error: Menu item with ID ${id} does not exist. Please enter a valid ID.`);
    } else {
      await menuItemService.deleteMenuItem(id);
      ws.send(`Menu item with ID ${id} deleted successfully.`);
      currentStateSetter('authenticated');
    }
  }
}

async function handleUpdateMenuItemStates(
  ws: WebSocket,
  msg: string,
  state: string,
  menuItemService:MenuItemService,
  currentStateSetter: (state: string) => void
) {
  if (state === 'updateMenuItemStart') {
    ws.send('Please enter the ID of the menu item to update:');
    currentStateSetter('updateMenuItemId');
  } else if (state === 'updateMenuItemId') {
    await handleUpdateMenuItemIdState(ws, msg, menuItemService, currentStateSetter);
  } else if (state === 'updateMenuItemDescription') {
    await handleUpdateMenuItemDescriptionState(ws, msg, currentStateSetter);
  } else if (state === 'updateMenuItemPrice') {
    await handleUpdateMenuItemPriceState(ws, msg, menuItemService, currentStateSetter);
  } else if (state === 'updateMenuItemCategory') {
    await handleUpdateMenuItemCategoryState(ws, msg, menuItemService, currentStateSetter);
  }
}

async function handleUpdateMenuItemIdState(
  ws: WebSocket,
  msg: string,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  const id = parseInt(msg, 10); // Convert msg to a number
  if (isNaN(id)) {
    ws.send('Invalid ID. Please enter a valid numeric ID.');
    return;
  }
  const existingMenuItem = await menuItemService.findById(id);
  if (!existingMenuItem) {
    ws.send(`Error: Menu item with ID ${id} does not exist. Please enter a valid ID.`);
  } else {
    updateMenuItemDetails.id = id;
    ws.send(`Enter new description for the menu item (or press enter to skip):`);
    currentStateSetter('updateMenuItemDescription');
  }
}

async function handleUpdateMenuItemDescriptionState(
  ws: WebSocket,
  msg: string,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.description = msg || undefined;
  ws.send(`Enter new price for the menu item (or press enter to skip):`);
  currentStateSetter('updateMenuItemPrice');
}

async function handleUpdateMenuItemPriceState(
  ws: WebSocket,
  msg: string,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.price = msg || undefined;
  const categories = await menuItemService.getCategories();
  ws.send(`Enter new category for the menu item (or press enter to skip). Available categories: ${categories.map(category => category.name).join(', ')}:`);
  currentStateSetter('updateMenuItemCategory');
}

async function handleUpdateMenuItemCategoryState(
  ws: WebSocket,
  msg: string,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  const category = await menuItemService.findCategoryByName(msg);
  if (!category && msg) {
    const categories = await menuItemService.getCategories();
    ws.send(`Error: Category ${msg} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
  } else {
    updateMenuItemDetails.category = msg || undefined;
    await menuItemService.updateMenuItem(updateMenuItemDetails.id!, {
      description: updateMenuItemDetails.description,
      price: updateMenuItemDetails.price,
      category: updateMenuItemDetails.category
    });
    ws.send(`Menu item updated successfully.`);
    updateMenuItemDetails = {};
    currentStateSetter('authenticated');
  }
}
