# Code Quality Assessment

## Test Coverage

- **Overall**: None (0%)
- **Unit Tests**: Not configured
- **Integration Tests**: Not configured
- **E2E Tests**: Not configured

**Note**: All feature components have `data-testid` attributes throughout, indicating the codebase was built with testing in mind. A testing framework would be easy to add given the existing test ID infrastructure.

## Code Quality Indicators

- **Linting**: Configured via ESLint (`next lint` script in package.json)
- **TypeScript**: Strict mode configured; comprehensive type coverage throughout
- **Code Style**: Consistent — all components follow the same structure (imports, interface, function export)
- **Documentation**: Minimal (no JSDoc comments, no inline explanations) — code is self-explanatory via naming
- **i18n Coverage**: Complete — all user-facing strings go through the `t()` function (no hardcoded UI strings except for hardcoded Vietnamese inline strings in `app/page.tsx` around line 48-64)

## Technical Debt

1. **Hardcoded strings in `app/page.tsx` (lines 48-65)**: Several welcome-back and continue-learning strings are conditionally built outside the `t()` system using `language === "vi"` checks. These should be moved to `data/translations.ts`.

2. **Duplicate theme providers**: `components/theme-provider.tsx` wraps `next-themes` ThemeProvider, while `contexts/theme-context.tsx` is a completely separate custom theme system. Only the custom one is used for the color themes (forest/pink/ocean). The `next-themes` version appears unused or vestigial.

3. **Creative Room sticker placement not persisted**: Canvas sticker arrangements are held in component state only — they are lost on navigation or refresh. This may be intentional (stateless play) but is likely a gap if users expect their artwork to persist.

4. **Sticker name mapping in StickerShop**: `getStickerName()` in `sticker-shop.tsx` uses a hardcoded `nameMap` dictionary to map sticker IDs to translation keys. This is brittle — adding new stickers requires updating both `data/stickers.ts` and this map.

5. **Math question generation in `learning-zone.tsx`**: The `generateMathQuestion()` function is defined inside the module but not co-located with the quiz data. Its output is memo-ized on component mount but doesn't regenerate between quiz sessions (user must leave/re-enter Learning Zone).

6. **Unused shadcn/ui components**: ~30 of the 40+ UI components in `components/ui/` are not used by the current feature set, inflating the project complexity and bundle.

7. **No error boundaries**: No React error boundary components are present. A crash in any sub-component would propagate to the root.

8. **localStorage access without try/catch**: All localStorage operations (read/write) are performed without error handling. In private browsing modes or when storage is full, these will throw uncaught exceptions.

9. **Creative Room avatars use hardcoded SVG**: Character avatars are rendered via a large `getCharacterSVG()` function with hardcoded SVG paths. Adding new characters requires modifying this function rather than adding asset files.

10. **`welcome-screen.tsx` relationship unclear**: A `components/welcome-screen.tsx` file exists alongside `components/welcome-form.tsx`. Its role relative to the welcome flow in `app/page.tsx` is not immediately clear from file inspection — it may be unused or a refactor residue.

## Patterns and Anti-patterns

### Good Patterns

- **Context + Custom Hook**: Clean separation of state logic with custom hooks (`useCoins`, `useLanguage`, `useTheme`) — prevents direct context consumer boilerplate
- **Single-responsibility components**: Each feature component has one clear purpose
- **Prop drilling avoidance**: Global state (coins, language, theme) flows via context; only view-specific navigation state is passed as props
- **Static data separation**: Quiz content and sticker catalog are cleanly separated into `data/` modules
- **localStorage hydration guard**: CoinContext and LanguageContext both use `isLoaded` / `mounted` state to prevent SSR/hydration mismatch before accessing localStorage
- **Consistent data-testid attributes**: Every interactive and meaningful UI element has a `data-testid`, enabling clean automated testing

### Anti-patterns

- **Duplicate theme system**: Two competing theme providers (`contexts/theme-context.tsx` vs `components/theme-provider.tsx`) — creates confusion about which is authoritative
- **Hardcoded locale strings outside i18n system** (`app/page.tsx`): Breaks the single-source-of-truth for translations
- **Large component with inline SVG generation** (`creative-room.tsx`): The `getCharacterSVG()` function is 150+ lines of SVG code inside the component file
- **No persistence for Creative Room state**: User artwork is not saved, which is likely unexpected behavior
- **Brittle sticker name mapping**: Manual ID-to-translation-key mapping in `sticker-shop.tsx` that must be kept in sync with `data/stickers.ts`
