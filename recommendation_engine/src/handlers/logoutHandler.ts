import { WebSocket } from 'ws';
import { UserService } from '../services/userService';
import { User } from '../entity/User';

export async function handleLogout(ws: WebSocket, userService: UserService, user: User) {
  user.logoutTime = new Date();
  await userService.save(user);
  ws.send(`Logging you out, ${user.username}.`);
  ws.close();
}
