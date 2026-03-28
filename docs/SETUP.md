# 🛠️ Universal Environment Setup & Installation

## 1. System Requirements
- **Runtime:** Node.js 18+ (recommended for Next.js 16)
- **Package Manager:** pnpm (preferred), npm or yarn also possible
- **Infrastructure:** None required for local dev (no DB or Docker needed)

## 2. Installation & First Run

1. **Clone & Navigate:**
   ```bash
   git clone <repository_url>
   cd MagicHouse
   ```

2. **Configuration:**
   - No `.env` required for basic usage.
   - If deploying or using APIs, create `.env` from any provided example.

3. **Install Dependencies:**
   ```bash
   pnpm install
   ```
   (Or use `npm install` or `yarn install` if you prefer.)

4. **Database / Migration:**
   - Not required for this project.

5. **Run Application:**
   ```bash
   pnpm dev
   ```
   (Or `npm run dev` / `yarn dev`.)

## 3. Recommended IDE Extensions
- GitHub Copilot & Copilot Chat
- VS Code extensions: Tailwind CSS IntelliSense, ESLint, Prettier, React
- Docker Extension (if you plan to containerize)
