import { createConnection } from 'typeorm';
import WebSocket from 'ws';
import { handleUserInputs } from './handlers/handleUserInputs';
import { handleMenuItemInputs } from './handlers/handleMenuItemInputs';
import { handleRoleBasedCommand } from './handlers/handleRoleBasedCommand';
import { showRoleBasedOptions } from './handlers/showRoleBasedOptions';
import { UserController } from './controllers/userController';
import { RoleController } from './controllers/roleController';
import { MenuItemController } from './controllers/menuItemController';
import { UserService } from './services/userService';
import { RoleService } from './services/roleService';
import { MenuItemService } from './services/menuItemService';
import { UserRepository } from './repositories/userRepository';
import { RoleRepository } from './repositories/roleRepository';
import { MenuItemRepository } from './repositories/menuItemRepository';
import { NotificationRepository } from './repositories/notificationRepository';
import { User } from './entity/User';
import { Role } from './entity/Role';
import { MenuItem } from './entity/MenuItem';
import { FoodCategory } from './entity/FoodCategory';
import { Notification } from './entity/Notification';
import bcrypt from 'bcrypt';

createConnection().then(async connection => {
  const userRepository = new UserRepository(connection.getRepository(User), connection.getRepository(Role));
  const roleRepository = new RoleRepository(connection.getRepository(Role));
  const menuItemRepository = new MenuItemRepository(connection.getRepository(MenuItem), connection.getRepository(FoodCategory));
  const notificationRepository = new NotificationRepository(connection.getRepository(Notification));

  const userService = new UserService(userRepository, notificationRepository);
  const roleService = new RoleService(roleRepository);
  const menuItemService = new MenuItemService(menuItemRepository);

  const userController = new UserController(userService);
  const roleController = new RoleController(roleService);
  const menuItemController = new MenuItemController(menuItemService);

  // Check for existing roles and create if they don't exist
  let adminRole = await roleService.getRoleByName('Admin');
  if (!adminRole) {
    await roleController.handleAddRole({ name: 'Admin' });
  }

  // Check for existing user and create if they don't exist
  let systemUserExists = await userService.checkUsername('system');
  if (!systemUserExists.exists) {
    await userController.handleAddUser({
      username: 'system',
      password: 'root',
      role: 'Admin'
    });
    console.log('Created new user: system');
  } else {
    console.log('User "system" already exists.');
  }

  // WebSocket Server
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.send('Please enter your username:');

    let currentUser: any | null = null;
    let currentState = 'username';
    let currentCommand: string | null = null;

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
            // Update last login time
            currentUser.lastLoginTime = new Date();
            await userController.save(currentUser);

            ws.send(`Welcome ${currentUser.username} to the application. Your role is ${currentUser.role.name}.`);
            currentState = 'authenticated';
            showRoleBasedOptions(ws, currentUser.role.name);

            // Show notifications
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
            currentStateSetter
          );
          if (currentState === 'authenticated') {
            showRoleBasedOptions(ws, currentUser.role.name);
          }
        } else {
          ws.send('An error occurred. Please reconnect.');
        }
      } else if (currentState.startsWith('addUser') || currentState.startsWith('updateUser') || currentState.startsWith('deleteUser')) {
        await handleUserInputs(ws, msg, currentState, userController, roleController, currentStateSetter);
      } else if (currentState.startsWith('addMenuItem') || currentState.startsWith('updateMenuItem') || currentState.startsWith('deleteMenuItem')) {
        await handleMenuItemInputs(ws, msg, currentState, menuItemController, currentStateSetter);
      } else if (currentState === 'addRole') {
        await roleController.handleAddRole({ name: msg });
      }
    });
  });

  console.log('WebSocket server is running on ws://localhost:8080');
}).catch(error => console.log(error));
