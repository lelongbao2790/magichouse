# 🚀 Feature Implementation Strategy

> **GitHub Copilot Context Instruction:** > 1. Analyze the existing codebase to identify the Architectural Pattern (e.g., Clean Architecture, Hexagonal, Layered, or MVC).
> 2. Detect the Dependency Injection (DI) pattern and Middleware usage.
> 3. Guide the developer to implement new features following these exact patterns.

## 1. Implementation Philosophy
Before writing a single line of code, remember our core principles:
- **Interface First:** Define the contract (`interface`) before the implementation.
- **Single Responsibility:** One class/function should do one thing well.
- **DRY (Don't Repeat Yourself):** Check the `{Common/Shared}` folder for existing utilities before creating new ones.
- **Decoupling:** Business logic should not depend on external frameworks (Database, UI, Third-party APIs) directly.

## 2. The 5-Step Workflow

### Step 1: Define the Data Model/Entity
- Locate the `{Domain/Models}` directory.
- Define your core entity or Data Transfer Object (DTO).
- **Rule:** Keep entities "pure" (no logic that depends on external services).

### Step 2: Create the Contract (Interface)
- Define the Service or Repository interface in the `{Application/Interfaces}` layer.
- *Example:* `IUserService.cs` or `user_service.go`.

### Step 3: Implement Business Logic
- Create the service implementation in the `{Application/Services}` or `{Logic}` folder.
- **Dependency Injection:** Inject required dependencies via Constructor.
- **Validation:** Validate input data before processing. Use [FluentValidation/Built-in Guard Clauses].

### Step 4: Infrastructure/Data Access
- If the feature requires database access, implement the Repository in the `{Infrastructure}` layer.
- Ensure SQL queries or ORM calls (EF Core, GORM, etc.) are optimized.

### Step 5: Presentation / Entry Point
- Add the new endpoint to the `{Controller/API/Handler}` layer.
- Keep controllers "thin"—they should only handle routing and basic validation, then delegate to Services.

## 3. Code Quality Checklist
> **Copilot:** Use this checklist to review the generated code.

- [ ] Does this follow the project's **Directory Structure**?
- [ ] Are all new services registered in the **DI Container**?
- [ ] Are sensitive strings moved to `appsettings.json` or `.env`?
- [ ] Is **Error Handling** implemented using the project's standard (e.g., Global Exception Handler)?
- [ ] (Optional) Is there a corresponding **Unit Test** for the new logic?

## 4. Implementation Example (Template)
To generate a boilerplate for a new feature, use the following prompt with Copilot:
*"@workspace Create a new feature for [Feature Name] following the 5-step workflow in 04-FEATURE_IMPLEMENTATION.md. Use [Interface Name] and [Entity Name]."*

---
*Note: Consistently following these steps ensures that our codebase remains maintainable and easy to debug as the project grows.*