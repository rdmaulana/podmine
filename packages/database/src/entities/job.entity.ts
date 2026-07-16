import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Podcast } from './podcast.entity';

@Entity('job')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'podcast_id' })
  podcastId!: string;

  @ManyToOne(() => Podcast, (podcast) => podcast.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcast_id' })
  podcast!: Relation<Podcast>;

  @Column({ default: 0 })
  progress!: number;

  @Column({ type: 'text', nullable: true })
  logs!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
