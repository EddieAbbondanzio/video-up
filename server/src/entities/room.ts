import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Participant } from "./participant";

@Entity({ withoutRowid: true })
export class Room extends BaseEntity {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "integer" })
  isActive!: boolean;

  @OneToMany(() => Participant, participant => participant.room)
  participants!: Participant[];
}
