// import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
// import { db } from "src/db";
// import { encrypt, encryptedDataToString } from "src/crypto/encryption";

// export interface Request {
//   key: string;
//   value: string;
//   clientSecret?: string;
// }

// export interface Response {}

// export const service: ServiceDefinition<Request, Response> = {
//   method: "vault.set",
//   requiredPermission: ["vault.set"],
//   isPublic: false,
//   handler: async (req: Request, ctx: RpcContext): Promise<Response> => {
//     try {
//       const VAULT_MASTER_PASSWORD = process.env.VAULT_MASTER_PASSWORD;
//       if (!VAULT_MASTER_PASSWORD) {
//         throw new Error("VAULT_MASTER_PASSWORD environment variable not set");
//       }

//       let valueToStore = req.value;

//       // Client-side E2E encryption (optional)
//       if (req.clientSecret) {
//         const encrypted = await encrypt(valueToStore, req.clientSecret);
//         valueToStore = encryptedDataToString(encrypted);
//       }

//       // Server-side encryption with master password
//       const encrypted = await encrypt(valueToStore, VAULT_MASTER_PASSWORD);
//       const encryptedValue = encryptedDataToString(encrypted);

//       const existing = await db
//         .selectFrom("vault")
//         .select("key")
//         .where("key", "=", req.key)
//         .where("userId", "=", ctx.userId)
//         .executeTakeFirst();

//       if (existing) {
//         await db
//           .updateTable("vault")
//           .set({ value: encryptedValue })
//           .where("key", "=", req.key)
//           .where("userId", "=", ctx.userId)
//           .execute();
//       } else {
//         await db
//           .insertInto("vault")
//           .values({
//             key: req.key,
//             value: encryptedValue,
//             userId: ctx.userId,
//           })
//           .execute();
//       }

//       await db
//         .insertInto("history")
//         .values({
//           key: req.key,
//           userId: ctx.userId || "unknown-user-should-never-happen",
//           type: "set",
//         })
//         .execute();
//     } catch (error) {
//       console.error("Error setting vault value:", error);
//       throw error;
//     }
//     return {};
//   },
//   validation: (req: Request) => {
//     if (!req || !req.key || !req.value) {
//       return null;
//     }

//     const result: Request = { key: req.key, value: req.value };
//     if (req.clientSecret && typeof req.clientSecret === "string") {
//       result.clientSecret = req.clientSecret;
//     }
//     return result;
//   },
// };
