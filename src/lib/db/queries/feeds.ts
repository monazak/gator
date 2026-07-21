import { db } from "..";
import { feeds, users } from "../schema";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, user_id: string) {
    const [feed] = await db.insert(feeds).values({ name, url, user_id }).returning();
    return feed;
}

export async function getAllFeedsWithUsers() {
    return await db
        .select({
            id: feeds.id,
            name: feeds.name,
            url: feeds.url,
            userName: users.name,
        })
        .from(feeds)
        .innerJoin(users, eq(feeds.user_id, users.id));
}

export async function getFeedByUrl(url: string) {
    const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
    return feed;
}
