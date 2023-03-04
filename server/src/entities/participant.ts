import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./room";

@Entity({ withoutRowid: true })
export class Participant {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "text" })
  websocketID!: string;

  @Column({ type: "text" })
  name!: string;

  @ManyToOne(() => Room, room => room.participants)
  room!: Room;
}
