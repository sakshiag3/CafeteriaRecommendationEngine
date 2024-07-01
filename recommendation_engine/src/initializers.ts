import { DataSource } from 'typeorm';
import { UserRepository } from './repositories/userRepository';
import { RoleRepository } from './repositories/roleRepository';
import { MenuItemRepository } from './repositories/menuItemRepository';
import { NotificationRepository } from './repositories/notificationRepository';
import { User } from './entity/User';
import { Role } from './entity/Role';
import { MenuItem } from './entity/MenuItem';
import { FoodCategory } from './entity/FoodCategory';
import { Notification } from './entity/Notification';
import { Recommendation } from './entity/Recommendation';
import { SelectedRecommendation } from './entity/SelectedRecommendation';
import { FinalSelection } from './entity/FinalSelection';
import { Vote } from './entity/Vote';
import { Feedback } from './entity/Feedback';
import { SentimentScore } from './entity/SentimentScore';
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

export function initializeRepositories(dataSource: DataSource) {
  return {
    recommendationRepository: dataSource.getRepository(Recommendation),
    selectedRecommendationRepository: dataSource.getRepository(SelectedRecommendation),
    finalSelectionRepository: dataSource.getRepository(FinalSelection),
    voteRepository: dataSource.getRepository(Vote),
    feedbackRepository: dataSource.getRepository(Feedback),
    sentimentScoreRepository: dataSource.getRepository(SentimentScore),
  };
}

export function initializeServices(repositories: any) {
  return {
    userService: new UserService(),
    roleService: new RoleService(),
    menuItemService: new MenuItemService(),
    recommendationService: new RecommendationService(),
    chefService: new ChefService(),
    adminService: new AdminService()
  };
}

export function initializeControllers(services: any, repositories: any) {
  return {
    userController: new UserController(),
    menuItemController: new MenuItemController(),
    chefController: new ChefController(
      services.recommendationService,
      services.chefService,
      services.menuItemService,
      repositories.menuItemRepository
    ),
    employeeController: new EmployeeController()
  };
}
