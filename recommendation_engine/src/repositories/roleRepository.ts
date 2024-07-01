import { Repository } from 'typeorm';
import { Role } from '../entity/Role';
import { AppDataSource } from '../data-source';
export class RoleRepository {
  private roleRepo: Repository<Role>
  
  constructor() {
    this.roleRepo = AppDataSource.getRepository(Role);
 }
 
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
