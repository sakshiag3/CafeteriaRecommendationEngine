import { WebSocket } from 'ws';

export function showRoleBasedOptions(ws: WebSocket, role: string) {
  if (role === 'Admin') {
    ws.send('Options: 1. Add User, 2. Add Menu Item, 3. Show Menu Items, 4. Update Menu Item, 5. Delete Menu Item');
  } else if (role === 'Chef') {
    ws.send('Options: 1. View Menu, 2. Fetch Recommendations, 3. Select Recommendations, 4. View Votes, 5. Select Item to Prepare');
  } else if (role === 'Employee') {
    ws.send('Options: 1. View Rolled Out Menu 2. Cast Vote, 3. View Prepared Items, 4. Give Feedback');
  }
}
