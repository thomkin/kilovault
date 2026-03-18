import { Generated, ColumnType } from "kysely";

export interface Vault {
  key: string;
  value: string;
  userId: string;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

export interface History {
  id: Generated<string>;
  key: string;
  type: "set" | "get";
  userId: string;
  createdAt: Generated<string>;
}

export interface Database {
  vault: Vault;
  history: History;
}
