import { WebSocket } from 'ws';
import { RoleService } from '../services/roleService';
import { Role } from '../entity/Role';

export async function showRoles(ws: WebSocket, roleService: RoleService) {
  const roles: Role[] = await roleService.getRoles();
  let roleTable = 'Roles:\n';
  roleTable += '+----------------+\n';
  roleTable += '| Name           |\n';
  roleTable += '+----------------+\n';
  roles.forEach((role: Role) => {
    roleTable += `| ${role.name.padEnd(14)} |\n`;
  });
  roleTable += '+----------------+\n';
  ws.send(roleTable);
}
