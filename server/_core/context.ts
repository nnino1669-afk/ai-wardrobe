import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // If running locally without OAUTH_SERVER_URL, supply a local dev admin user automatically
    if (!ENV.oAuthServerUrl) {
      const localOpenId = "local-dev-user";
      let localUser = await db.getUserByOpenId(localOpenId);
      if (!localUser) {
        await db.upsertUser({
          openId: localOpenId,
          name: "Local Developer",
          email: "dev@local.host",
          loginMethod: "local",
          role: "admin",
          lastSignedIn: new Date(),
        });
        localUser = await db.getUserByOpenId(localOpenId);
      }
      user = localUser as User;
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
