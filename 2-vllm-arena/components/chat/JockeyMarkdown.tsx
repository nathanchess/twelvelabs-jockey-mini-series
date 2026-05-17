"use client";

import { Fragment, type ReactNode } from "react";
import {
  tokenizeInline,
  type MdBlock,
  type MdListItem,
  type MarkedAssetRef,
} from "@/lib/jockey-markdown";

type AssetRenderer = (ref: MarkedAssetRef, key: string) => ReactNode;

type JockeyMarkdownProps = {
  blocks: MdBlock[];
  assetRefs: MarkedAssetRef[];
  renderAsset: AssetRenderer;
};

function renderInlineTokens(
  content: string,
  assetRefs: MarkedAssetRef[],
  renderAsset: AssetRenderer
): ReactNode[] {
  return tokenizeInline(content).map((token, i) => {
    const key = `inline-${i}`;
    switch (token.type) {
      case "text":
        return <Fragment key={key}>{token.value}</Fragment>;
      case "bold":
        return (
          <strong key={key} className="font-semibold text-text-primary">
            {renderInlineTokens(token.value, assetRefs, renderAsset)}
          </strong>
        );
      case "italic":
        return <em key={key}>{token.value}</em>;
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-card px-1 py-0.5 font-mono text-[0.9em] text-text-primary"
          >
            {token.value}
          </code>
        );
      case "asset": {
        const ref = assetRefs[token.index];
        if (!ref) return null;
        return <Fragment key={key}>{renderAsset(ref, key)}</Fragment>;
      }
      default:
        return null;
    }
  });
}

function renderListItems(
  items: MdListItem[],
  assetRefs: MarkedAssetRef[],
  renderAsset: AssetRenderer,
  depth = 0
): ReactNode {
  return (
    <ul
      className={`list-disc space-y-1.5 pl-5 ${depth > 0 ? "mt-1.5" : ""}`}
    >
      {items.map((item, index) => (
        <li key={`${depth}-${index}`} className="leading-relaxed">
          <span>
            {renderInlineTokens(item.content, assetRefs, renderAsset)}
          </span>
          {item.children.length > 0
            ? renderListItems(item.children, assetRefs, renderAsset, depth + 1)
            : null}
        </li>
      ))}
    </ul>
  );
}

export function JockeyMarkdown({
  blocks,
  assetRefs,
  renderAsset,
}: JockeyMarkdownProps) {
  return (
    <div className="jockey-markdown space-y-3 text-sm leading-relaxed text-text-primary">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <Fragment key={index}>
              {renderListItems(block.items, assetRefs, renderAsset)}
            </Fragment>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {renderInlineTokens(block.content, assetRefs, renderAsset)}
          </p>
        );
      })}
    </div>
  );
}
