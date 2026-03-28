# 🛠️ Universal Environment Setup & Installation

> **GitHub Copilot Context Instruction:** > Detect the build tool (e.g., dotnet, npm, go mod, pip, cargo). Provide the specific terminal commands for this specific project.

## 1. System Requirements
To develop and run this project, ensure you have:
- **Runtime:** {Auto-detect: Language Runtime Version}
- **Package Manager:** {Auto-detect: e.g., NuGet, NPM, Go Modules, Maven}
- **Infrastructure:** [e.g., Docker Desktop, SQL Server, Redis]

## 2. Installation & First Run
Follow these steps to get the environment ready:

1. **Clone & Navigate:**
   ```bash
   git clone <repository_url>
   cd <project_directory>

2. ***Configuration:**

Locate any .env.example or appsettings.json.template files.
Create a local version (e.g., .env or appsettings.Development.json).
Update connection strings and API keys as needed.

3. ***Install Dependencies:***
# Copilot: Insert the detected install command here

4. **Database / Migration (If applicable)**
# Copilot: Insert the detected migration/DB update command here

5. **Run Application:**
# Copilot: Insert the detected run command here (e.g., dotnet run, go run, etc.)

## 3. Recommended IDE Extensions

For the best experience with this project, please install:
GitHub Copilot & Copilot Chat
{Language_Specific_Extension} (e.g., C# Dev Kit, Go, Python, etc.)
Docker Extension (if applicable)
Troubleshooting: If the build fails, run @workspace /terminal Explain the error in the last command.