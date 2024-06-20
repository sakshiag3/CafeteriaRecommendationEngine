import { WebSocket } from 'ws';

export function showRoleBasedOptions(ws: WebSocket, role: string) {
  if (role === 'Admin') {
    ws.send('Options: 1. Add User, 2. Add Role, 3. Add Menu Item, 4. Show Users, 5. Show Roles, 6. Show Menu Items, 7. Update Menu Item, 8. Delete Menu Item');
  } else if (role === 'Chef') {
    ws.send('Options: 1. View Menu, 2. Recommend Menu, 3. Fetch Recommendations');
  } else if (role === 'Employee') {
    ws.send('Options: 1. Give Feedback, 2. Cast Vote');
  }
}
