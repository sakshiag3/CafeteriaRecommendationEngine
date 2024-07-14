import WebSocket from 'ws';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { MenuItemService } from '../services/menuItemService';

let updateMenuItemDetails: { id?: number; description?: string; price?: string; category?: string; availabilityStatus?: boolean; dietaryRestriction?: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian'; spiceLevel?: 'High' | 'Medium' | 'Low'; regionalPreference?: 'North Indian' | 'South Indian' | 'Other'; isSweet?: boolean } = {};

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

    const existingMenuItem = await menuItemService.findByName(name);
    if (existingMenuItem) {
      ws.send(`Error: Menu item with name ${name} already exists. Please enter a different name:`);
    } else {
      const categoryEntity = await menuItemService.findCategoryByName(category);
      if (!categoryEntity) {
        const categories = await menuItemService.getCategories();
        ws.send(`Error: Category ${category} does not exist. Available categories: ${categories.map(category => category.name).join(', ')}. Please enter a valid category:`);
      } else {
        await menuItemService.addMenuItem(
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
  menuItemService: MenuItemService,
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
  } else if (state === 'updateMenuItemAvailabilityStatus') {
    await handleUpdateMenuItemAvailabilityStatusState(ws, msg, currentStateSetter);
  } else if (state === 'updateMenuItemDietaryRestriction') {
    await handleUpdateMenuItemDietaryRestrictionState(ws, msg, currentStateSetter);
  } else if (state === 'updateMenuItemSpiceLevel') {
    await handleUpdateMenuItemSpiceLevelState(ws, msg, currentStateSetter);
  } else if (state === 'updateMenuItemRegionalPreference') {
    await handleUpdateMenuItemRegionalPreferenceState(ws, msg, currentStateSetter);
  } else if (state === 'updateMenuItemIsSweet') {
    await handleUpdateMenuItemIsSweetState(ws, msg, menuItemService, currentStateSetter);
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
    ws.send(`Enter new availability status for the menu item (true or false, or press enter to skip):`);
    currentStateSetter('updateMenuItemAvailabilityStatus');
  }
}

async function handleUpdateMenuItemAvailabilityStatusState(
  ws: WebSocket,
  msg: string,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.availabilityStatus = msg.toLowerCase() === 'true' || msg.toLowerCase() === 'false' ? msg.toLowerCase() === 'true' : undefined;
  ws.send(`Enter new dietary restriction for the menu item (Vegetarian, Non-Vegetarian, Eggetarian, or press enter to skip):`);
  currentStateSetter('updateMenuItemDietaryRestriction');
}

async function handleUpdateMenuItemDietaryRestrictionState(
  ws: WebSocket,
  msg: string,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.dietaryRestriction = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'].includes(msg) ? msg as 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' : undefined;
  ws.send(`Enter new spice level for the menu item (High, Medium, Low, or press enter to skip):`);
  currentStateSetter('updateMenuItemSpiceLevel');
}

async function handleUpdateMenuItemSpiceLevelState(
  ws: WebSocket,
  msg: string,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.spiceLevel = ['High', 'Medium', 'Low'].includes(msg) ? msg as 'High' | 'Medium' | 'Low' : undefined;
  ws.send(`Enter new regional preference for the menu item (North Indian, South Indian, Other, or press enter to skip):`);
  currentStateSetter('updateMenuItemRegionalPreference');
}

async function handleUpdateMenuItemRegionalPreferenceState(
  ws: WebSocket,
  msg: string,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.regionalPreference = ['North Indian', 'South Indian', 'Other'].includes(msg) ? msg as 'North Indian' | 'South Indian' | 'Other' : undefined;
  ws.send(`Enter if the menu item is sweet (true or false, or press enter to skip):`);
  currentStateSetter('updateMenuItemIsSweet');
}

async function handleUpdateMenuItemIsSweetState(
  ws: WebSocket,
  msg: string,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  updateMenuItemDetails.isSweet = msg.toLowerCase() === 'true' || msg.toLowerCase() === 'false' ? msg.toLowerCase() === 'true' : undefined;
  await menuItemService.updateMenuItem(updateMenuItemDetails.id!, updateMenuItemDetails);
  ws.send(`Menu item updated successfully.`);
  updateMenuItemDetails = {};
  currentStateSetter('authenticated');
}
