import { XMLParser } from "fast-xml-parser";
export type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

export type RSSFeed = {
    channel: {
        title: string;
        link: string;
        description: string;
        item: RSSItem[];
    };
};

export async function fetchFeed(feedURL: string) {
    if (!feedURL || typeof feedURL !== "string") {
        throw new Error("invalid url");
    }
    const response = await fetch(feedURL, {
        headers: {
            "User-Agent": "gator",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch feed from server. Status code: ${response.status}`);
    }
    const xmlText = await response.text();

    const parserObject = new XMLParser({
        processEntities: false,
        ignoreAttributes: false,
        maxNestedTags: 99999,
        cdataPropName: "__cdata",
        stopNodes: ["description", "content:encoded", "rss.channel.item.description"],
    });

    const parsedData = parserObject.parse(xmlText);

    if (!parsedData || !parsedData.rss || !parsedData.rss.channel) {
        throw new Error(
            "Invalid XML structure: Target document missing required <rss> or <channel> tags."
        );
    }
    const channelData = parsedData.rss.channel;

    const title = channelData.title;
    const link = channelData.link;
    const description = channelData.description;

    if (typeof title !== "string" || typeof link !== "string" || typeof description !== "string") {
        throw new Error(
            "Missing or invalid channel metadata fields (title, link, or description)."
        );
    }

    let rawItems = channelData.item;
    let arrayItems: any[] = [];

    if (rawItems) {
        if (Array.isArray(rawItems)) {
            arrayItems = rawItems;
        } else if (typeof rawItems === "object") {
            arrayItems = [rawItems];
        }
    }
    const cleanItems: RSSItem[] = [];

    arrayItems.forEach((item) => {
        if (item.title && item.link && item.pubDate) {
            // Extract raw description string or CDATA object content
            let rawDesc =
                (typeof item.description === "object"
                    ? item.description?.__cdata
                    : item.description) ||
                (typeof item["content:encoded"] === "object"
                    ? item["content:encoded"]?.__cdata
                    : item["content:encoded"]) ||
                item.summary ||
                "";

            // Strip HTML tags and CDATA markers to test if there's actual content
            const textOnly = String(rawDesc)
                .replace(/<!\[CDATA\[|]]>/g, "")
                .replace(/<[^>]*>?/gm, "")
                .trim();

            // If empty OR just "Comments" (like Hacker News), fallback to the title
            let finalDesc = textOnly;
            if (!textOnly || textOnly.toLowerCase() === "comments") {
                finalDesc = item.title;
            }

            cleanItems.push({
                title: item.title,
                link: item.link,
                description: finalDesc,
                pubDate: item.pubDate,
            });
        }
    });

    return {
        channel: {
            title,
            link,
            description,
            item: cleanItems,
        },
    };
}
