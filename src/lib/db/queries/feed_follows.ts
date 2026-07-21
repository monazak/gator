import { db } from "..";
import { feed_follows, feeds, users } from "../schema";
import { eq, and } from "drizzle-orm";
import { User } from "../schema";
export async function createFeedFollow(feed_id: string, user_id: string) {
    const [newFeedFollow] = await db.insert(feed_follows).values({ feed_id, user_id }).returning();

    const [result] = await db
        .select({
            id: feed_follows.id,
            createdAt: feed_follows.createdAt,
            updatedAt: feed_follows.updatedAt,
            user_id: feed_follows.user_id,
            feed_id: feed_follows.feed_id,
            userName: users.name,
            feedName: feeds.name,
        })
        .from(feed_follows)
        .innerJoin(users, eq(feed_follows.user_id, users.id))
        .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
        .where(eq(feed_follows.id, newFeedFollow.id));

    return result;
}
export async function getFeedFollowsForUser(user_id: string) {
    return await db
        .select({
            id: feed_follows.id,
            feedName: feeds.name,
            feedUrl: feeds.url,
            userName: users.name,
        })
        .from(feed_follows)
        .innerJoin(users, eq(feed_follows.user_id, users.id))
        .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
        .where(eq(feed_follows.user_id, user_id));
}

export async function deleteFeedFollow(user_id: string, feed_url:string) {

    const [feed] = await db.select({id:feeds.id}).from(feeds).where(eq(feeds.url, feed_url));
    if (!feed){
        return false
    }
    const result = await db
        .delete(feed_follows)
        .where(
            and(
                eq(feed_follows.user_id, user_id),
                eq(feed_follows.feed_id, feed.id)
            ) 
        )
        .returning();
    
    return result.length > 0;
}