import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { RoleController } from '../controllers/roleController';
import { MenuItemController } from '../controllers/menuItemController';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { MenuItemService } from '../services/menuItemService';
import { RecommendationService } from '../services/recommendationService';
import { ChefService } from '../services/chefService';
import { showMenuItems } from '../handlers/showMenuItems';
import { handleLogout } from '../handlers/logoutHandler';
import { ChefController } from '../controllers/chefController';
import { EmployeeController } from '../controllers/employeeController';
import { Repository } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { FoodCategory } from '../entity/FoodCategory';
export async function handleRoleBasedCommand(
  ws: WebSocket,
  user: User,
  command: string,
  roleController: RoleController,
  menuItemController: MenuItemController,
  userController: UserController,
  userService: UserService,
  roleService: RoleService,
  menuItemService: MenuItemService,
  recommendationService: RecommendationService,
  chefService: ChefService,
  chefController: ChefController,
  employeeController: EmployeeController,
  menuItemRepository: Repository<MenuItem>,
  foodCategoryRepository: Repository<FoodCategory>,
  currentStateSetter: (state: string) => void
) {
  if (user.role.name === 'Admin') {
    if (command === '1') {
      ws.send('Admin: Add User');
      ws.send('Please enter username for the new user:');
      currentStateSetter('addUserUsername');
    } else if (command === '2') {
      ws.send('Admin: Add Menu Item');
      ws.send('Please enter the new menu item details in the format "name,description,price,category":');
      currentStateSetter('addMenuItemDetails');
    } else if (command === '3') {
      await showMenuItems(ws, menuItemService);
    } else if (command === '4') {
      ws.send('Admin: Update Menu Item');
      ws.send('Please enter the ID of the menu item to update:');
      currentStateSetter('updateMenuItemId');
    } else if (command === '5') {
      ws.send('Admin: Delete Menu Item');
      ws.send('Please enter the ID of the menu item to delete:');
      currentStateSetter('deleteMenuItemId');
    } else if (command.toLowerCase() === 'logout') {
      await handleLogout(ws, userService, user);
    } else {
      ws.send('Unknown command.');
    }
  } else if (user.role.name === 'Chef') {
    if (command === '1') {
      await showMenuItems(ws, menuItemService);
    } else if (command === '2') {
      await chefController.fetchRecommendations(ws);
    } else if (command === '3') {
      currentStateSetter('selectRecommendations');
    } else if (command === '4') {
      await chefController.viewVotes(ws);
    } else if (command === '5') {
      currentStateSetter('selectItemToPrepare');
      ws.send('Please enter the IDs of the items you wish to prepare for each meal (Breakfast, Lunch, Dinner), separated by commas:');
      ws.send('Format: BreakfastID,LunchID,DinnerID');
    } else if (command.toLowerCase() === 'logout') {
      await handleLogout(ws, userService, user);
    } else {
      ws.send('Unknown command.');
    }
  } else if (user.role.name === 'Employee') {
    const userId = user.id;
    if (command === '1') {
      await employeeController.viewSelectedMenuItems(ws);
    } else if (command === '2') {
      ws.send('Employee: Cast Vote');
      ws.send('Please enter the meal and menu item ID to vote for in the format "Meal,MenuItemID":');
      currentStateSetter('employeeCastVote');
    } else if (command === '3') {
      await employeeController.viewPreparedMenuItems(ws);
    } else if (command === '4') {
      ws.send('Employee: Give Feedback');
      ws.send('Please enter your feedback in the format "menuItemId;rating;comment":');
      currentStateSetter('employeeGiveFeedback');
    } else if (command.toLowerCase() === 'logout') {
      await handleLogout(ws, userService, user);
    } else {
      ws.send('Unknown command.');
    }
  }
}
