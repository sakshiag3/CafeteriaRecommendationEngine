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
import { RoleController } from './controllers/roleController';
import { MenuItemController } from './controllers/menuItemController';
import { ChefController } from './controllers/chefController';
import { EmployeeController } from './controllers/employeeController';
import { AdminController } from './controllers/adminController';

export function initializeRepositories(dataSource: DataSource) {
  return {
    userRepository: new UserRepository(dataSource.getRepository(User), dataSource.getRepository(Role)),
    roleRepository: new RoleRepository(dataSource.getRepository(Role)),
    menuItemRepository: new MenuItemRepository(dataSource.getRepository(MenuItem), dataSource.getRepository(FoodCategory)),
    notificationRepository: new NotificationRepository(dataSource.getRepository(Notification)),
    recommendationRepository: dataSource.getRepository(Recommendation),
    selectedRecommendationRepository: dataSource.getRepository(SelectedRecommendation),
    finalSelectionRepository: dataSource.getRepository(FinalSelection),
    voteRepository: dataSource.getRepository(Vote),
    feedbackRepository: dataSource.getRepository(Feedback),
    sentimentScoreRepository: dataSource.getRepository(SentimentScore)
  };
}

export function initializeServices(repositories: any) {
  return {
    userService: new UserService(repositories.userRepository, repositories.notificationRepository),
    roleService: new RoleService(repositories.roleRepository),
    menuItemService: new MenuItemService(repositories.menuItemRepository),
    recommendationService: new RecommendationService(
      repositories.recommendationRepository,
      repositories.selectedRecommendationRepository,
      repositories.feedbackRepository,
      repositories.sentimentScoreRepository
    ),
    chefService: new ChefService()
  };
}

export function initializeControllers(services: any, repositories: any) {
  return {
    userController: new UserController(services.userService),
    roleController: new RoleController(services.roleService),
    menuItemController: new MenuItemController(services.menuItemService),
    chefController: new ChefController(
      services.recommendationService,
      services.chefService,
      services.menuItemService,
      repositories.menuItemRepository
    ),
    employeeController: new EmployeeController(
      repositories.selectedRecommendationRepository,
      repositories.finalSelectionRepository,
      repositories.voteRepository,
      repositories.feedbackRepository,
      repositories.sentimentScoreRepository,
      repositories.menuItemRepository
    ),
    adminController: new AdminController(
      repositories.menuItemRepository,
      repositories.feedbackRepository,
      repositories.sentimentScoreRepository
    )
  };
}
