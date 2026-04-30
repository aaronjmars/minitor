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
  /**
   * If true, the API may return a `nextCursor` and the column card renders
   * Load more. The same value reaching `null` from the server means
   * "exhausted". One-shot integrations (Grok, RSS, etc.) leave this false.
   */
  paginated?: boolean;
}

/** Config-erased view of a registered column type — what the registry stores. */
export type AnyColumnType = ColumnType<Record<string, unknown>>;

/**
 * Registers a typed `ColumnType<T>` as an `AnyColumnType` without sprinkling
 * `as unknown as` casts at every call site. The cast is unsafe in principle
 * (TConfig is invariant) but safe in practice because every consumer treats
 * the config as opaque JSON.
 */
export function defineColumnType<TConfig extends Record<string, unknown>>(
  t: ColumnType<TConfig>,
): AnyColumnType {
  return t as unknown as AnyColumnType;
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
