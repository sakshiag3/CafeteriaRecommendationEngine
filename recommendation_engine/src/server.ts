import { AppDataSource } from './data-source'; 
import WebSocket from 'ws';
import { handleUserInputs } from './handlers/handleUserInputs';
import { handleMenuItemInputs } from './handlers/handleMenuItemInputs';
import { handleRoleBasedCommand } from './handlers/handleRoleBasedCommand';
import { handleChefInputs } from './handlers/handleChefInputs';
import { showRoleBasedOptions } from './handlers/showRoleBasedOptions';
import { UserController } from './controllers/userController';
import { RoleController } from './controllers/roleController';
import { MenuItemController } from './controllers/menuItemController';
import { ChefController } from './controllers/chefController';
import { EmployeeController } from './controllers/employeeController';
import { UserService } from './services/userService';
import { RoleService } from './services/roleService';
import { MenuItemService } from './services/menuItemService';
import { RecommendationService } from './services/recommendationService';
import { ChefService } from './services/chefService';
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
import { SentimentScore } from './entity/SentimentScore'; // Import the SentimentScore entity
import bcrypt from 'bcrypt';

AppDataSource.initialize().then(async connection => {
  const userRepository = new UserRepository(AppDataSource.getRepository(User), AppDataSource.getRepository(Role));
  const roleRepository = new RoleRepository(AppDataSource.getRepository(Role));
  const menuItemRepository = new MenuItemRepository(AppDataSource.getRepository(MenuItem), AppDataSource.getRepository(FoodCategory));
  const notificationRepository = new NotificationRepository(AppDataSource.getRepository(Notification));
  const recommendationRepository = AppDataSource.getRepository(Recommendation);
  const selectedRecommendationRepository = AppDataSource.getRepository(SelectedRecommendation);
  const finalSelectionRepository = AppDataSource.getRepository(FinalSelection);
  const voteRepository = AppDataSource.getRepository(Vote);
  const feedbackRepository = AppDataSource.getRepository(Feedback);
  const sentimentScoreRepository = AppDataSource.getRepository(SentimentScore); // Get the SentimentScore repository

  const userService = new UserService(userRepository, notificationRepository);
  const roleService = new RoleService(roleRepository);
  const menuItemService = new MenuItemService(menuItemRepository);
  const recommendationService = new RecommendationService(recommendationRepository, selectedRecommendationRepository, feedbackRepository, sentimentScoreRepository);
  const chefService = new ChefService();

  const userController = new UserController(userService);
  const roleController = new RoleController(roleService);
  const menuItemController = new MenuItemController(menuItemService);
  const chefController = new ChefController(
    recommendationService,
    chefService,
    menuItemService,
    AppDataSource.getRepository(MenuItem),
    AppDataSource.getRepository(FoodCategory)
  );
  const employeeController = new EmployeeController(
    selectedRecommendationRepository,
    finalSelectionRepository,
    voteRepository,
    feedbackRepository,
    sentimentScoreRepository,
    AppDataSource.getRepository(MenuItem)
  );

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.send('Please enter your username:');

    let currentUser: any | null = null;
    let currentState = 'username';
    let currentCommand: string | null = null;
    let selectedIdsByMeal: { meal: string; ids: string[] }[] = [];

    const currentStateSetter = (state: string) => {
      currentState = state;
    };

    ws.on('message', async (message) => {
      const msg = message.toString().trim();
      console.log(`Received message: ${msg}`);

      if (currentState === 'username') {
        const { exists } = await userController.checkUsername(msg);
        if (exists) {
          currentUser = await userController.findByUsername(msg);
          ws.send('Please enter your password:');
          currentState = 'password';
        } else {
          ws.send('Invalid username. Please try again:');
        }
      } else if (currentState === 'password') {
        if (currentUser && currentUser.password) {
          const isMatch = await bcrypt.compare(msg, currentUser.password);
          if (isMatch) {
            currentUser.lastLoginTime = new Date();
            await userController.save(currentUser);

            ws.send(`Welcome ${currentUser.username} to the application. Your role is ${currentUser.role.name}.`);
            currentState = 'authenticated';
            showRoleBasedOptions(ws, currentUser.role.name);

            const notifications = await userController.getNotifications(currentUser);
            if (notifications.length > 0) {
              notifications.forEach((notification: any) => {
                ws.send(`Notification: ${notification.content}`);
              });
            } else {
              ws.send('No new notifications.');
            }
          } else {
            ws.send('Invalid password. Please try again:');
            currentState = 'username';
          }
        } else {
          ws.send('Invalid password. Please try again:');
          currentState = 'username';
        }
      } else if (currentState === 'authenticated') {
        if (currentUser) {
          await handleRoleBasedCommand(
            ws,
            currentUser,
            msg,
            roleController,
            menuItemController,
            userController,
            userService,
            roleService,
            menuItemService,
            recommendationService,
            chefService,
            chefController,
            employeeController,
            AppDataSource.getRepository(MenuItem),
            AppDataSource.getRepository(FoodCategory),
            currentStateSetter
          );
          showRoleBasedOptions(ws, currentUser.role.name);
        } else {
          ws.send('An error occurred. Please reconnect.');
        }
      } else if (currentState === 'selectRecommendations') {
        await handleChefInputs(ws, msg, currentState, chefController,userService, roleService, currentStateSetter, selectedIdsByMeal);
      } else if (currentState === 'selectItemToPrepare') {
        const selectedIds = msg.split(',').map(id => parseInt(id.trim(), 10));
        const meals = ['Breakfast', 'Lunch', 'Dinner'];
        const selectedMealsIds = meals.map((meal, index) => ({ meal, id: selectedIds[index] }));
        await chefController.selectItemToPrepare(ws, selectedMealsIds);
        currentState = 'authenticated';
      } else if (currentState === 'employeeCastVote') {
        const [meal, menuItemId] = msg.split(',').map(part => part.trim());
        await employeeController.castVote(ws, currentUser.id, parseInt(menuItemId, 10), meal);
        currentState = 'authenticated';
      } else if (currentState === 'employeeGiveFeedback') {
        const [menuItemId, rating, ...commentParts] = msg.split(';');
        const comment = commentParts.join(';').trim();
        await employeeController.giveFeedback(ws,currentUser.id, parseInt(menuItemId, 10), parseInt(rating, 10), comment);
        currentStateSetter('authenticated');
      } else if (currentState.startsWith('addUser') || currentState.startsWith('updateUser') || currentState.startsWith('deleteUser')) {
        await handleUserInputs(ws, msg, currentState, userController, roleController, currentStateSetter);
      } else if (currentState.startsWith('addMenuItem') || currentState.startsWith('updateMenuItem') || currentState.startsWith('deleteMenuItem')) {
        await handleMenuItemInputs(ws, msg, currentState, menuItemController, userService, roleService, currentStateSetter);
      } else if (currentState === 'addRole') {
        await roleController.handleAddRole({ name: msg });
      }
    });
  });

  console.log('WebSocket server is running on ws://localhost:8080');
}).catch(error => console.log(error));
