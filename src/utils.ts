import { ITEMS } from "./constants/items";

const MINIMUM_INVENTORY_ITEMS = 5;
const MAXIMUM_INVENTORY_ITEMS = 15;

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
