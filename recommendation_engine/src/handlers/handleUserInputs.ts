import WebSocket from 'ws';
import { UserController } from '../controllers/userController';
import { RoleController } from '../controllers/roleController';

let newUserDetails: { username?: string; password?: string; roleName?: string } = {};

export async function handleUserInputs(
  ws: WebSocket,
  msg: string,
  state: string,
  userController: UserController,
  roleController: RoleController,
  currentStateSetter: (state: string) => void
) {
  switch (state) {
    case 'addUserUsername':
      await handleAddUserUsername(ws, msg, userController, currentStateSetter);
      break;
    case 'addUserPassword':
      await handleAddUserPassword(ws, msg, roleController, currentStateSetter);
      break;
    case 'addUserRole':
      await handleAddUserRole(ws, msg, userController, roleController, currentStateSetter);
      break;
    default:
      ws.send('Invalid state. Please try again.');
  }
}

async function handleAddUserUsername(
  ws: WebSocket,
  msg: string,
  userController: UserController,
  currentStateSetter: (state: string) => void
) {
  const existingUser = await userController.findByUsername(msg);
  if (existingUser) {
    ws.send(`Error: User with username ${msg} already exists. Please enter a different username:`);
  } else {
    newUserDetails.username = msg;
    ws.send(`Enter password for the new user ${newUserDetails.username}:`);
    currentStateSetter('addUserPassword');
  }
}

async function handleAddUserPassword(
  ws: WebSocket,
  msg: string,
  roleController: RoleController,
  currentStateSetter: (state: string) => void
) {
  newUserDetails.password = msg;
  const roles = await roleController.getRoles();
  const roleNames = roles.map(role => role.name);
  ws.send(`Enter role for the new user ${newUserDetails.username}. Available roles: ${roleNames.join(', ')}:`);
  currentStateSetter('addUserRole');
}

async function handleAddUserRole(
  ws: WebSocket,
  msg: string,
  userController: UserController,
  roleController: RoleController,
  currentStateSetter: (state: string) => void
) {
  const roleExists = await roleController.checkRole(msg);
  if (!roleExists.exists) {
    const roles = await roleController.getRoles();
    ws.send(`Error: Role ${msg} does not exist. Available roles: ${roles.map(role => role.name).join(', ')}. Please enter a valid role:`);
  } else {
    newUserDetails.roleName = msg;
    await userController.handleAddUser({
      username: newUserDetails.username!,
      password: newUserDetails.password!,
      role: newUserDetails.roleName!
    });
    ws.send(`User ${newUserDetails.username} added successfully.`);
    newUserDetails = {};
    currentStateSetter('authenticated');
  }
}
