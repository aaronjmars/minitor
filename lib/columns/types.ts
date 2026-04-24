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
