# User Story: My House

**Priority:** P1
**Feature:** My House
**Version:** V1
**Persona:** Child / Student

## User Story

**As a** child,
**I want to** use the coins I earn from learning activities to buy furniture and decorate my own house,
**So that** I can personalize my own space and feel rewarded for learning.

---

## Business Description

Magic House currently allows children to earn coins from learning activities and use purchased stickers in the existing **Decoration** area to customize their Boy/Girl character.

**My House** extends the reward experience by introducing a separate personal space where children can use their coins to purchase furniture and decorate rooms.

My House will be introduced as a **new main navigation tab**, separate from the existing Decoration feature.

The two features have different purposes:

* **Decoration** → Customize the child's Boy/Girl character using stickers.
* **My House** → Customize rooms using furniture and house decorations.

The core My House experience is:

**Learn → Earn Coins → Buy Items → Decorate House → Save**

---

# Navigation

Add **My House** as a new main tab.

Existing navigation remains unchanged, with My House added as an additional option.

When the child selects **My House**, the system opens the My House experience.

---

# Room Navigation

My House should be designed to support multiple rooms.

Initial room navigation:

* Bedroom
* Kitchen
* Living Room
* Garden

For V1:

**Bedroom is the only active room.**

Other rooms may be displayed as **Locked / Coming Later** to establish the future house structure without implementing their functionality.

---

# Functional Requirements

## FR-1 – My House

When the child selects **My House**, display:

* Room navigation
* Bedroom
* Current coin balance
* Owned house items
* Available furniture/decorations

The Bedroom is the default room for V1.

---

## FR-2 – Existing Coin Balance

My House must reuse the existing Magic House coin balance.

No separate House currency should be introduced.

Example:

**Current Balance:** 200 coins
**Bed:** 100 coins
**Remaining Balance:** 100 coins

The updated balance must remain consistent with the rest of Magic House.

---

## FR-3 – House Items

Provide an initial collection of approximately **5–8 Bedroom items**.

Example:

| Item       |     Price |
| ---------- | --------: |
| Bed        | 100 coins |
| Desk       |  70 coins |
| Lamp       |  40 coins |
| Teddy Bear |  30 coins |
| Plant      |  50 coins |
| Rug        |  60 coins |

Each item displays:

* Image
* Name
* Coin price
* Available / Owned status

House item assets are new and need to be added as part of this feature.

---

## FR-4 – Purchase House Item

The child can purchase an available item using existing coins.

Before purchase:

**Coin Balance >= Item Price**

After a successful purchase:

1. Deduct the item price.
2. Update the existing coin balance.
3. Mark the item as owned.
4. Make the item available in **My Items**.

If the child does not have enough coins, the purchase must not be completed.

---

## FR-5 – My Items

Display purchased house items in a **My Items** area.

Example:

`🛏 Bed   💡 Lamp   🧸 Teddy Bear   🪴 Plant`

The child can select or drag an owned item from My Items into the Bedroom.

Purchased items remain owned and do not need to be purchased again.

---

## FR-6 – Decorate Bedroom

The child can customize the Bedroom using owned items.

Support:

* Drag item into Bedroom
* Drop item at a selected position
* Move existing item
* Remove item from Bedroom
* Return removed item to My Items

Reuse the existing Decoration drag-and-drop interaction where technically appropriate.

---

## FR-7 – Save Bedroom

Bedroom customization should be automatically saved.

Persist at minimum:

* Purchased house items
* Items placed in Bedroom
* Position of each item

When the child returns to My House, the previous Bedroom configuration must be restored.

---

# Acceptance Criteria

## AC-1 – My House Navigation

**Given** the child is using Magic House
**When** the main navigation is displayed
**Then** My House is available as a separate navigation option from Decoration.

---

## AC-2 – Open My House

**Given** the child selects My House
**When** the page opens
**Then** Bedroom is displayed as the default room
**And** the current coin balance is visible
**And** house items are available.

---

## AC-3 – Room Navigation

**Given** the child is in My House
**Then** the UI supports room navigation.

For V1:

* Bedroom is available.
* Other configured rooms may be displayed as locked or unavailable.

---

## AC-4 – Existing Coins

**Given** the child has coins earned from learning
**When** the child enters My House
**Then** the same existing coin balance is displayed and used.

---

## AC-5 – Purchase Item

**Given** the child has 150 coins
**And** a Bed costs 100 coins
**When** the child purchases the Bed
**Then** the Bed becomes owned
**And** appears in My Items
**And** the balance becomes 50 coins.

---

## AC-6 – Insufficient Coins

**Given** the child does not have enough coins
**When** the child attempts to purchase an item
**Then** the purchase is prevented
**And** no coins are deducted.

---

## AC-7 – Decorate Bedroom

**Given** the child owns a house item
**When** the child drags the item into the Bedroom
**Then** the item is placed at the selected position.

---

## AC-8 – Move or Remove Item

**Given** an item has been placed in the Bedroom
**When** the child moves or removes the item
**Then** the Bedroom is updated
**And** removed items remain owned.

---

## AC-9 – Restore Bedroom

**Given** the child has decorated the Bedroom
**When** the child leaves My House and returns
**Then** previously purchased items remain owned
**And** the saved Bedroom layout is restored.

---

# Existing Capabilities to Reuse

Reuse where possible:

* Learning activities
* Coin rewards
* Existing coin balance
* User/profile
* Existing drag-and-drop behavior

The existing **Decoration** feature remains unchanged and continues to handle Boy/Girl character and sticker decoration.

---

# V1 Scope

V1 includes:

1. New **My House** main tab
2. Room navigation structure
3. Bedroom
4. 5–8 Bedroom items
5. Purchase using existing coins
6. My Items
7. Drag-and-drop Bedroom decoration
8. Save and restore Bedroom

---

# Future Scope

Future versions can unlock:

* Kitchen
* Living Room
* Garden
* Additional furniture
* Wallpaper
* Room upgrades
* Special/rare items
* Additional house customization

---

## Core Loop

**Learn → Earn → Buy → Decorate → Save → Unlock More**
