# Business Overview

## Business Context Diagram

```
+-----------------------------------------------------------+
|                   MAGIC HOUSE                             |
|        Children's Educational Web Application             |
|          Target: Vietnamese children ages 4-7             |
+-----------------------------------------------------------+
         |                    |                    |
         v                    v                    v
  +-------------+    +----------------+    +-------------+
  | Learning    |    | Rewards &      |    | Creative    |
  | Zone        |    | Economy        |    | Room        |
  | (Quiz-based)|    | (Coin system)  |    | (Decor.)    |
  +-------------+    +----------------+    +-------------+
         |                    |                    |
         v                    v                    v
  +-------------+    +----------------+    +-------------+
  | Preschool   |    | Sticker Shop   |    | Character   |
  | Grade 1     |    | (Purchase      |    | Decoration  |
  | Quizzes     |    |  with coins)   |    | (Drag-drop) |
  +-------------+    +----------------+    +-------------+
```

## Business Description

- **Business Description**: Magic House (Ngoi nha phep thuat) is a Vietnamese-language-first educational web application for children aged 4-7. It gamifies early learning through interactive quizzes across preschool and Grade 1 subjects. Children earn virtual coins by completing quizzes and spend them in the Sticker Shop. Purchased stickers are used in the Creative Room to decorate animated character avatars. The platform supports both Vietnamese and English languages and offers three visual themes.

- **Business Transactions**:
  1. **User Registration** — Child enters their name to create a session (persisted in localStorage)
  2. **Quiz Completion** — Child takes a topic quiz (Shapes, Colors, Animals, Math, Vietnamese, English) and earns 10 coins upon completion
  3. **Sticker Purchase** — Child spends coins to purchase decorative stickers from the shop
  4. **Character Decoration** — Child drags and drops owned stickers onto chosen avatar characters in the Creative Room
  5. **Language Switch** — Parent/child switches interface language between Vietnamese and English
  6. **Theme Switch** — Parent/child switches visual theme (Forest Green / Pink Candy / Ocean)
  7. **Session Resume** — Returning user is greeted by name with saved coins and stickers (localStorage)
  8. **Name Reset** — Child/parent clears saved name to start fresh

- **Business Dictionary**:
  - **Xu (Coins)**: Virtual in-app currency earned by completing quizzes; spent in the Sticker Shop
  - **Sticker**: A purchasable emoji-based cosmetic item with a category (hat, glasses, bow, toy)
  - **Character**: An SVG avatar (Boy, Girl, Panda, Fox, Unicorn, Bunny) that serves as the decoration canvas
  - **Preschool (Mam non)**: Educational tier for age 4-5 covering Shapes, Colors, Animals
  - **Grade 1 (Lop 1)**: Educational tier for age 6-7 covering Math, Vietnamese, English
  - **Quiz**: A multiple-choice question sequence (3-10 questions) within a topic category
  - **Creative Room (Phong sang tao)**: The character decoration workspace
  - **Sticker Shop (Cua hang Sticker)**: The storefront where coins are exchanged for stickers

## Component Level Business Descriptions

### Welcome / Home Screen
- **Purpose**: Entry point that collects or recognizes the child's name; provides language and theme customization before entering the app
- **Responsibilities**: Name persistence, session detection, routing to Dashboard

### Dashboard
- **Purpose**: Central navigation hub after login; routes children to the three main activity zones
- **Responsibilities**: Display greeting, show coin balance, navigate to Shop / Creative Room / Learning Zone

### Learning Zone
- **Purpose**: The primary educational engine; presents subject-based quizzes and awards coins on completion
- **Responsibilities**: Tab-based level selection (Preschool / Grade 1), category card display, quiz lifecycle management, coin award triggering

### Quiz Modal
- **Purpose**: Delivers individual quiz experiences with feedback and progress tracking
- **Responsibilities**: Question display, answer validation, score tracking, results screen, coin claim trigger

### Sticker Shop
- **Purpose**: The in-app economy store where children spend earned coins on cosmetic stickers
- **Responsibilities**: Category browsing, purchase validation (balance check), purchase animation, collection count display

### Creative Room
- **Purpose**: The creative/play zone where children express themselves by decorating avatar characters
- **Responsibilities**: Character selection, drag-and-drop sticker placement on canvas, sticker resize/delete, clear-all canvas reset
