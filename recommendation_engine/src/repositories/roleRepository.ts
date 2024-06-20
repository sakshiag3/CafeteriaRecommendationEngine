import { Repository } from 'typeorm';
import { Role } from '../entity/Role';

export class RoleRepository {
  constructor(private readonly roleRepo: Repository<Role>) {}

  async findByName(name: string): Promise<Role | null> {  // Adjust return type to include null
    return this.roleRepo.findOne({ where: { name } });
  }

  async findRoles(): Promise<Role[]> {
    return this.roleRepo.find();
  }

  async save(role: Partial<Role>): Promise<void> {  // Accept Partial<Role>
    await this.roleRepo.save(role);
  }
}
