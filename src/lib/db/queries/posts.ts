import { db } from "..";
import { posts, feed_follows } from "../schema";
import { eq, desc, inArray } from "drizzle-orm";
import type { NewPost } from "../schema";

export async function createPost(postData: NewPost) {
    try {
        const [post] = await db
            .insert(posts)
            .values(postData)
            .onConflictDoNothing({ target: posts.url }) // Skip duplicate posts based on URL
            .returning();
        return post ?? null;
    } catch (error) {
        console.error("Failed to create post:", error);
        return null;
    }
}

export async function getPostsForUser(userId: string, limit: number = 2) {
    // 1. Get all feed IDs the user follows
    const userFollows = await db
        .select({ feedId: feed_follows.feed_id })
        .from(feed_follows)
        .where(eq(feed_follows.user_id, userId));

    const feedIds = userFollows.map((f) => f.feedId);

    if (feedIds.length === 0) {
        return [];
    }

    // 2. Fetch recent posts from those feeds, ordered by publishedAt descending
    return await db
        .select()
        .from(posts)
        .where(inArray(posts.feedId, feedIds))
        .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
        .limit(limit);
}