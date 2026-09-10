# User Story: My House

**Priority:** P1
**Feature:** My House
**Version:** V1
**Persona:** Child / Student

## User Story

**As a** child,
**I want to** use the coins I earn from learning activities to buy furniture and decorate my own room,
**So that** I can personalize my space and feel rewarded for learning.

---

## Business Goal

Children currently earn coins by completing learning activities.

**My House** gives those coins additional value by allowing children to purchase virtual furniture and decorations and customize their own personal space.

The core experience is:

**Learn → Earn Coins → Buy Items → Decorate → Save**

---

## V1 Scope

The first version will support **one room: Bedroom**.

The Bedroom provides the initial house customization experience and establishes the foundation for adding more rooms and decoration features in future versions.

### Initial Items

Provide **5–8 house items**, such as:

| Item       |     Price |
| ---------- | --------: |
| Bed        | 100 coins |
| Desk       |  70 coins |
| Lamp       |  40 coins |
| Teddy Bear |  30 coins |
| Plant      |  50 coins |
| Rug        |  60 coins |

House item assets need to be added as part of this feature.

---

# Functional Requirements

## FR-1 – My House

Add a **My House** entry to Magic House.

When the child opens My House, the Bedroom is displayed.

The page should provide:

* Bedroom decoration area
* Current coin balance
* Available house items
* Owned items

---

## FR-2 – Existing Coin Balance

My House must use the child's existing Magic House coin balance.

No separate currency should be introduced.

For example:

**Current Balance:** 200 coins
**Buy Bed:** 100 coins
**New Balance:** 100 coins

Any coin changes made in My House must be reflected in the existing coin balance throughout the application.

---

## FR-3 – House Items

Provide a collection of furniture and decoration items that can be purchased.

Each item should contain:

* Item image
* Item name
* Coin price
* Purchase status: Available / Owned

The first version only requires enough items to provide a meaningful Bedroom customization experience.

---

## FR-4 – Purchase Item

The child can purchase a house item using existing coins.

Before completing the purchase, the system must verify:

**Coin Balance >= Item Price**

When the purchase succeeds:

1. Deduct the item price from the existing coin balance.
2. Mark the item as owned.
3. Make the item available for Bedroom decoration.

An owned item does not need to be purchased again.

---

## FR-5 – Decorate Bedroom

The child can use owned items to decorate the Bedroom.

The child should be able to:

* Select an owned item.
* Drag and drop the item into the Bedroom.
* Move the item to another position.
* Remove the item from the Bedroom.
* Use the item again after removing it.

Reuse the existing drag-and-drop interaction pattern where possible.

---

## FR-6 – Save Bedroom

The Bedroom configuration should be saved automatically.

At minimum, persist:

* Purchased items
* Items placed in the Bedroom
* Position of each placed item

When the child returns to My House, the previously saved Bedroom should be restored.

---

# Acceptance Criteria

## AC-1 – Open My House

**Given** the child is using Magic House
**When** the child selects **My House**
**Then** the Bedroom is displayed
**And** the current coin balance is visible
**And** available house items can be viewed.

---

## AC-2 – Use Existing Coins

**Given** the child has coins earned from learning activities
**When** the child enters My House
**Then** the same existing coin balance is used for purchasing house items.

---

## AC-3 – Purchase an Item

**Given** the child has 150 coins
**And** a Bed costs 100 coins
**When** the child purchases the Bed
**Then** the purchase succeeds
**And** the Bed becomes owned
**And** the Bed becomes available for decoration
**And** the coin balance becomes 50.

---

## AC-4 – Insufficient Coins

**Given** the child has 50 coins
**And** the Bed costs 100 coins
**When** the child attempts to purchase the Bed
**Then** the purchase is not completed
**And** no coins are deducted
**And** a child-friendly insufficient-coins message is displayed.

---

## AC-5 – Place an Item

**Given** the child owns an item
**When** the child drags the item into the Bedroom
**Then** the item is placed at the selected valid position.

---

## AC-6 – Move an Item

**Given** an item is already placed in the Bedroom
**When** the child moves the item
**Then** the item is displayed at the new position
**And** the new position is saved.

---

## AC-7 – Remove an Item

**Given** an owned item is placed in the Bedroom
**When** the child removes the item
**Then** the item is removed from the Bedroom
**And** remains owned
**And** can be used again without another purchase.

---

## AC-8 – Restore Bedroom

**Given** the child has purchased and placed items
**When** the child leaves My House and returns later
**Then** purchased items remain owned
**And** previously placed items are restored to their saved positions.

---

# Existing Capabilities to Reuse

Reuse existing Magic House capabilities where possible:

* Learning activities
* Coin reward logic
* Existing coin balance
* User/profile information
* Existing drag-and-drop interaction pattern

These capabilities should not be rebuilt specifically for My House.

---

# New Scope

V1 introduces:

1. My House entry
2. Bedroom
3. House item collection
4. House item assets
5. Purchase and ownership
6. Bedroom decoration
7. Save and restore Bedroom configuration

---

# Out of Scope for V1

The following are not required for V1:

* Multiple rooms
* Study Room
* Living Room
* Garden
* Pet Room
* Wallpaper customization
* Item rotation
* Item resizing
* Room-specific item restrictions
* Selling items
* Trading items
* Gifting items
* Visiting other houses
* Multiplayer
* House ranking

These capabilities can be introduced in future versions.

---

## Core Loop

**Learn → Earn → Buy → Decorate → Save**
