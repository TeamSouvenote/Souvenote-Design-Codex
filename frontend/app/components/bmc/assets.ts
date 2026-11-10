import type { CardDraftAsset } from "../../lib/api";

/** The newest saved asset of one type ("image" or "song"). */
export function latestAsset(assets: CardDraftAsset[], type: "image" | "song") {
  return assets.filter((asset) => String(asset.assetType || asset.asset_type) === type).at(-1) || null;
}

/** A displayable address for a generated image, or null while there's only a placeholder. */
export function assetImageUrl(asset: CardDraftAsset | null) {
  return asset?.mockUrl && /^https?:\/\//i.test(asset.mockUrl) ? asset.mockUrl : null;
}
