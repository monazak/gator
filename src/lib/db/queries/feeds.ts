import { fetchFeed } from "src/lib/rss";
import { db } from "..";
import { feeds, users } from "../schema";
import { eq, sql } from "drizzle-orm";
import console from "node:console";
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

export async function markFeedFetched(feed_id: string) {
    const now = new Date();
    const [feed] = await db
        .update(feeds)
        .set({
            last_fetched_at:now, 
            updatedAt:now,
        })
        .where(eq(feeds.id, feed_id))
        
    return feed ?? null;
}

export async function getNextFeedToFetch() {
    const [feed] = await db
        .select()
        .from(feeds)
        .orderBy(sql`${feeds.last_fetched_at} ASC NULLS FIRST`)
        .limit(1);

    return feed?? null;
}

export async function scrapeFeeds(){
    const feed = await getNextFeedToFetch();
    if (!feed){
        console.log('no feeds foung to fetch. ');
        return;
    }
    console.log(`\nFetching feed: ${feed.name} (${feed.url})...`);
    
    await markFeedFetched(feed.id)

    try{
        const rssData = await fetchFeed(feed.url);
        console.log(`--- ${rssData.channel.title} (${rssData.channel.item.length} items) ---`)
        for (const item of rssData.channel.item){
            console.log(`* ${item.title}`)
        } 
    }catch(error){
        console.error(`Failed to fetch feed '${feed.name}':`, error)
    }
}

export function parseDuration(durationStr: string): number{
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    if(! match){
        throw new Error("Invalid duration format. Use e.g. 500ms, 1s, 1m, or 1h.")
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]
    
    switch (unit){
        case('ms'): return value ;
        case "s": return value * 1000;
        case "m":return value * 60 * 1000;
        case "h":return value * 60 * 60 * 1000;
        default: throw new Error("Unsupported time unit");
    }
}