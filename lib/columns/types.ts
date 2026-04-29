import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export interface FeedAuthor {
  name: string;
  handle?: string;
  avatarUrl?: string;
}

export interface FeedItem {
  id: string;
  author: FeedAuthor;
  content: string;
  url?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface ConfigFormProps<TConfig> {
  value: TConfig;
  onChange: (next: TConfig) => void;
}

export interface ItemRendererProps {
  item: FeedItem;
}

export interface PageResult {
  items: FeedItem[];
  /** Opaque cursor for the next page, or undefined when exhausted. */
  nextCursor?: string;
}

export interface ColumnType<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  defaultConfig: TConfig;
  defaultTitle: (config: TConfig) => string;
  ConfigForm: ComponentType<ConfigFormProps<TConfig>>;
  ItemRenderer: ComponentType<ItemRendererProps>;
  fetch: (config: TConfig) => Promise<FeedItem[]>;
  /**
   * Optional pagination. When defined, the column-card will:
   *  1. Call `fetchPage(config)` for the initial fetch and stash `nextCursor`.
   *  2. Show a "Load more" button while `nextCursor !== undefined`.
   *  3. On click, call `fetchPage(config, cursor)` with the latest cursor,
   *     append items, replace the cursor.
   *
   * Integrations that don't paginate naturally (RSS, X-via-Grok, etc.) leave
   * this undefined — those columns get no Load More button.
   */
  fetchPage?: (config: TConfig, cursor?: string) => Promise<PageResult>;
}

export interface Column {
  id: string;
  typeId: string;
  title: string;
  config: Record<string, unknown>;
  items: FeedItem[];
  lastFetchedAt?: string;
}

export interface Deck {
  id: string;
  name: string;
  columnIds: string[];
}
