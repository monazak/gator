import { db } from "..";
import { feeds } from "../schema";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, user_id: string) {
    const [feed] = await db.insert(feeds).values({ name, url, user_id }).returning();
    return feed;
}
