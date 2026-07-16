import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from './user.entity';
import { Job } from './job.entity';

export enum PodcastStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('podcast')
export class Podcast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  title!: string | null;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ name: 'audio_url', type: 'text', nullable: true })
  audioUrl!: string | null;

  @Column({
    type: 'enum',
    enum: PodcastStatus,
    default: PodcastStatus.QUEUED,
  })
  status!: PodcastStatus;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.podcasts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Job, (job: Job) => job.podcast)
  jobs!: Relation<Job>[];
}
