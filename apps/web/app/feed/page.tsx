import React from "react";
import { createApiClient } from "@suppr/contracts/client";
import type { EventCard, FeedPost } from "@suppr/contracts";
import { DarkThemeMount } from "../DarkThemeMount.js";
import { FeedClient } from "../FeedClient.js";

export const dynamic = "force-dynamic";

const FEED_PAGE_SIZE = 10;

async function loadFeedData(city?: string) {
  const api = createApiClient({ baseUrl: process.env.API_URL! });

  const todayIso = new Date().toISOString().slice(0, 10);

  const [tonightEvents, feedPosts] = await Promise.allSettled([
    api.events.list({ date: todayIso, ...(city ? { q: city } : {}) }),
    api.feed.list({}),
  ]);

  const events: EventCard[] =
    tonightEvents.status === "fulfilled" ? tonightEvents.value : [];
  const posts: FeedPost[] =
    feedPosts.status === "fulfilled" ? feedPosts.value : [];

  const lastPost = posts[posts.length - 1];
  const nextCursor =
    posts.length >= FEED_PAGE_SIZE ? (lastPost?.published_at ?? null) : null;

  return { events, posts, nextCursor };
}

export default async function FeedPage() {
  const city = process.env.DEFAULT_CITY;
  const { events, posts, nextCursor } = await loadFeedData(city);

  return (
    <>
      <DarkThemeMount />
      <FeedClient
        initialFeed={posts}
        tonightEvents={events}
        nextCursor={nextCursor}
        city={city}
      />
    </>
  );
}
