import { WebSocket } from 'ws';
import { UserService } from '../services/userService';
import { User } from '../entity/User';

export async function showUsers(ws: WebSocket, userService: UserService) {
  const users: User[] = await userService.getUsers();
  let userTable = 'Users:\n';
  userTable += '+-----------------+----------------+---------------------+---------------------+\n';
  userTable += '| Username        | Role           | Last Login Time     | Logout Time         |\n';
  userTable += '+-----------------+----------------+---------------------+---------------------+\n';
  users.forEach((user: User) => {
    const roleName = user.role ? user.role.name : 'N/A';
    const lastLoginTime = user.lastLoginTime ? user.lastLoginTime.toISOString().substring(0, 19).replace('T', ' ') : 'N/A';
    const logoutTime = user.logoutTime ? user.logoutTime.toISOString().substring(0, 19).replace('T', ' ') : 'N/A';
    userTable += `| ${user.username.padEnd(15)} | ${roleName.padEnd(14)} | ${lastLoginTime.padEnd(19)} | ${logoutTime.padEnd(19)} |\n`;
  });
  userTable += '+-----------------+----------------+---------------------+---------------------+\n';
  ws.send(userTable);
}
