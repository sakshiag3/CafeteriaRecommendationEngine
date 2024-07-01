import { UserService } from './services/userService';
import { RoleService } from './services/roleService';
import { MenuItemService } from './services/menuItemService';
import { RecommendationService } from './services/recommendationService';
import { ChefService } from './services/chefService';
import { UserController } from './controllers/userController';
import { MenuItemController } from './controllers/menuItemController';
import { ChefController } from './controllers/chefController';
import { EmployeeController } from './controllers/employeeController';
import { AdminService } from './services/adminService';

export function initializeServices() {
  return {
    userService: new UserService(),
    roleService: new RoleService(),
    menuItemService: new MenuItemService(),
    recommendationService: new RecommendationService(),
    chefService: new ChefService(),
    adminService: new AdminService()
  };
}

export function initializeControllers() {
  return {
    userController: new UserController(),
    menuItemController: new MenuItemController(),
    chefController: new ChefController(),
    employeeController: new EmployeeController()
  };
}
