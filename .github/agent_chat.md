CREATING DOCUMENT
---
1. Open the prompt file in github/docs
2. Open copilot chat and chat (Repeat for all file in prompt)
Help me fill in the blanks in this file based on the current project structure and export in docs folder
----
AFTER HAVING THE DOCUMENT, EACH TIME DOING TASK, INCLUDE THE DOCS FILE JUST CREATED IN CHAT THAT COPILOT CAN UNDERSTAND.
---

1. UNDERSTANDING AND SETUP PROJECT
Based on #file:PROJECT_GUIDE.md , explain how this project works and data flow
I am a new dev, help me finish the #file:SETUP.md by identifying my specific install commands
Export both it in folder docs in two file

2. DEVELOP
Before doing task:
---
I need to add a 'User Login' feature. Based on 01-PROJECT_OVERVIEW.md and 04-FEATURE_IMPLEMENTATION.md, where should I create the new files and what is the first step?

---
@workspace I'm starting a new task to "Add Email Notification". According to **03-DEVELOPMENT_WORKFLOW.md**, what should my branch name be and what are the first steps?

After doing task
---
Write a commit message for my current changes following the standards in **03-DEVELOPMENT_WORKFLOW.md**.

3. Feature Implementation
Scaffolding
===
@workspace I need to implement a "Product Search" feature. Follow the 5-step process in **04-FEATURE_IMPLEMENTATION.md**. Start with Step 1 and 2 (Entity and Interface)

---
I am writing the Service layer for 'User Login'. Ensure the code follows the Dependency Injection and Validation rules in 04-FEATURE_IMPLEMENTATION.md.


Business Logic
----
Now implement Step 3 for the Product Search. Remember the "Dependency Injection" and "Validation" rules in the guide.

Self-Review
---
Check my current code against the checklist in **04-FEATURE_IMPLEMENTATION.md**. Did I miss anything?

4. Pull request template
@workspace I have finished the 'Product Search' feature. Based on my changes and .github/PULL_REQUEST_TEMPLATE.md, please generate a detailed PR description for me.

5. Testing
Write unit tests for this Service using the AAA pattern and naming conventions defined in 05-TESTING_STANDARDS.md

6.
Review my changes. Generate a commit message following 03-DEVELOPMENT_WORKFLOW.md and fill out the PULL_REQUEST_TEMPLATE.md for me.
