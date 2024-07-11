import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserProfileQuestion {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  questionText!: string;

  @Column('simple-array')
  options!: string[]; // Store options as a comma-separated string
}
