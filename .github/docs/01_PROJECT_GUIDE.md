# 🗺️ Project Intelligence & Architecture Guide

> **GitHub Copilot Context Instruction:** > Please analyze the current workspace. Identify the primary programming language, framework, and entry point. Use this context to explain the project to a new developer.

## 1. Project Identity
- **Name:** [Insert Project Name]
- **Core Purpose:** [Briefly describe what this system does, e.g., Financial Trading Bot / Outsourced Web Portal]
- **Primary Stack:** {Auto-detect: Tech Stack & Versions}
- **Target Environment:** [e.g., AWS, Docker, Localhost]

## 2. Directory Structure (The Map)
> **Copilot:** Summarize the folder hierarchy and their specific roles in this project.

| Directory | Responsibility / Content |
| :--- | :--- |
| `{Source_Folder}` | Core application logic and entry points. |
| `{Domain/Models}` | Business entities, data structures, and constants. |
| `{Infrastructure}` | External integrations (Database, API Clients, Cloud Services). |
| `{Scripts/Tools}`  | Deployment scripts or automation tools. |
| `{Tests}`          | Unit, Integration, and E2E tests. |

## 3. Architecture & Design Patterns
- **Architecture Style:** [e.g., Clean Architecture, MVC, Microservices]
- **Standard Data Flow:** [e.g., Controller -> Service -> Repository -> DB]
- **Naming Conventions:** {Auto-detect: e.g., PascalCase for C#, snake_case for Python/Go}

## 4. Development Workflow & Rules
- **Concurrency/Async:** [e.g., Use async/await for all I/O bound operations]
- **Error Handling:** [e.g., Use Global Exception Middleware or Result Pattern]
- **Coding Standards:** Follow the existing patterns found in the `{Source_Folder}`. No new features without corresponding tests.

---
*Note: This guide is intended for onboarding. If anything is unclear, ask Copilot: "@workspace How does the [Module Name] work?"*