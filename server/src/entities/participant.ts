import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Room } from "./room";

@Entity({ withoutRowid: true })
export class Participant extends BaseEntity {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "text" })
  websocketID!: string;

  @Column({ type: "integer" })
  isActive!: boolean;

  @Column({ type: "integer" })
  isHost!: boolean;

  // Each participant belongs to a single room because when the user closes their
  // tab and opens a new link later on they'd be considered a "different" participant
  // because of the new web socket connection.
  @ManyToOne(() => Room, room => room.participants)
  room!: Room | null;
}
