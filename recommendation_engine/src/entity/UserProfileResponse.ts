import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { UserProfileQuestion } from './UserProfileQuestion';

@Entity()
export class UserProfileResponse {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => UserProfileQuestion, { eager: true })
  question!: UserProfileQuestion;

  @Column()
  response!: string;
}
