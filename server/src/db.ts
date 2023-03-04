import * as path from "path";
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const DB_FILE_NAME = "./calls.db";

export const dataSource = new DataSource({
  type: "sqlite",
  database: DB_FILE_NAME,
  entities: [path.join(__dirname, "entities/*.ts")],
  namingStrategy: new SnakeNamingStrategy(),
  logging: true,
  synchronize: process.env.NODE_ENV !== "production",
});
