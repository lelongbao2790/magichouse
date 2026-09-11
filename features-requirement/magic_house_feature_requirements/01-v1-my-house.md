# My House

## Business Description

Currently, Magic House allows children to complete learning activities and earn coins.

The application also has an existing **Decoration** tab where children can select a Boy or Girl character and use purchased stickers to decorate the character.

We want to introduce **My House** as a new main tab.

My House gives children another way to use the coins they earn from learning by allowing them to purchase furniture and decorate their own virtual house.

The core experience is:

**Learn → Earn Coins → Buy House Items → Decorate House → Save**

## Existing Behavior

The following capabilities already exist and should be reused where possible:

* Learning activities
* Coin rewards from completed practices
* Existing coin balance
* User/profile
* Decoration feature for Boy/Girl characters
* Existing drag-and-drop interaction pattern

The existing **Decoration** feature must remain unchanged.

## Requirements

### My House Navigation

Add **My House** as a new main navigation tab, separate from the existing Decoration tab.

When the child selects My House, display the house and room navigation.

The house should be designed to support:

* Bedroom
* Kitchen
* Living Room
* Garden

For the first version, only **Bedroom** needs to be functional. Other rooms can be displayed as locked or unavailable.

### House Items

Provide approximately 5–8 Bedroom furniture/decorative items, such as:

* Bed
* Desk
* Lamp
* Teddy Bear
* Plant
* Rug

House item assets do not currently exist in the project and need to be added.

### Purchase

Children can purchase house items using their **existing coin balance**.

Do not introduce a separate currency for My House.

After purchasing an item:

* Deduct its price from the existing coin balance.
* Mark the item as owned.
* Make it available in My Items.
* The child should not need to purchase the same owned item again.

If the child does not have enough coins, the purchase should be prevented.

### Decorate Bedroom

Children can use owned items to decorate the Bedroom.

They should be able to:

* Drag an owned item into the Bedroom.
* Move the item.
* Remove the item.
* Reuse an owned item without purchasing it again.

Reuse the existing drag-and-drop behavior where appropriate.

### Save

The Bedroom configuration should be automatically saved.

When the child returns to My House:

* Purchased items remain owned.
* Previously placed items are restored.
* Item positions are restored.

## First Version Scope

Include:

* New My House main tab
* Room navigation
* Bedroom
* 5–8 Bedroom items
* Purchase using existing coins
* My Items
* Drag-and-drop decoration
* Save and restore Bedroom

## Out of Scope

Not required for the first version:

* Functional Kitchen
* Functional Living Room
* Functional Garden
* Wallpaper customization
* Item rotation/resizing
* Selling or trading items
* Gifting
* Visiting other houses
* Multiplayer
* House ranking
