import { MAXIMUM_INVENTORY_ITEMS, MINIMUM_INVENTORY_ITEMS } from "./constants/game";
import { ITEMS } from "./constants/items";

export function generateRandomInventory(): { id: string; name: string }[] {
  const items = [];
  const amount =
    Math.floor(
      Math.random() * (MAXIMUM_INVENTORY_ITEMS - MINIMUM_INVENTORY_ITEMS + 1)
    ) + MINIMUM_INVENTORY_ITEMS;

  for (let i = 0; i < amount; i++) {
    items.push({ id: crypto.randomUUID(), name: ITEMS[Math.floor(Math.random() * ITEMS.length)] });
  }

  return items;
}
