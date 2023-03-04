import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Participant } from "./participant";

@Entity({ withoutRowid: true })
export class Room {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @OneToOne(() => Participant)
  @JoinColumn()
  host!: Participant;

  @OneToMany(() => Participant, participant => participant.room)
  participants!: Participant[];
}
