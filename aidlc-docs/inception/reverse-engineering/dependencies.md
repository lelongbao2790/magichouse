# Dependencies

## Internal Dependencies

```
app/page.tsx
  depends on --> contexts/theme-context.tsx
  depends on --> contexts/language-context.tsx
  depends on --> contexts/coin-context.tsx
  depends on --> components/welcome-form.tsx
  depends on --> components/dashboard.tsx
  depends on --> components/floating-elements.tsx
  depends on --> components/theme-switcher.tsx
  depends on --> components/language-switcher.tsx

components/dashboard.tsx
  depends on --> contexts/coin-context.tsx
  depends on --> contexts/language-context.tsx
  depends on --> components/coin-display.tsx
  depends on --> components/theme-switcher.tsx
  depends on --> components/language-switcher.tsx
  depends on --> components/quiz-modal.tsx
  depends on --> components/fireworks.tsx
  depends on --> components/sticker-shop.tsx
  depends on --> components/creative-room.tsx
  depends on --> components/learning-zone.tsx

components/learning-zone.tsx
  depends on --> contexts/language-context.tsx
  depends on --> components/coin-display.tsx
  depends on --> components/theme-switcher.tsx
  depends on --> components/language-switcher.tsx
  depends on --> components/quiz-modal.tsx
  depends on --> components/fireworks.tsx

components/quiz-modal.tsx
  depends on --> contexts/language-context.tsx

components/sticker-shop.tsx
  depends on --> contexts/coin-context.tsx
  depends on --> contexts/language-context.tsx
  depends on --> components/coin-display.tsx
  depends on --> components/theme-switcher.tsx
  depends on --> components/language-switcher.tsx
  depends on --> data/stickers.ts

components/creative-room.tsx
  depends on --> contexts/coin-context.tsx
  depends on --> contexts/language-context.tsx
  depends on --> components/coin-display.tsx
  depends on --> components/theme-switcher.tsx
  depends on --> components/language-switcher.tsx
  depends on --> data/stickers.ts
  depends on --> data/translations.ts

contexts/language-context.tsx
  depends on --> data/translations.ts

components/coin-display.tsx
  depends on --> contexts/coin-context.tsx
  depends on --> contexts/language-context.tsx

components/theme-switcher.tsx
  depends on --> contexts/theme-context.tsx

components/language-switcher.tsx
  depends on --> contexts/language-context.tsx
```

## Context Dependency Chain

```
ThemeProvider
  > LanguageProvider
    > CoinProvider
      > HomeContent (app/page.tsx)
        > All feature components
```

All feature components can access all three contexts via their hooks (`useTheme`, `useLanguage`, `useCoins`).

## External Dependencies

### Production Dependencies

| Package | Version | Purpose | License |
|---|---|---|---|
| next | 16.2.0 | Framework | MIT |
| react | 19.2.4 | UI library | MIT |
| react-dom | 19.2.4 | DOM rendering | MIT |
| framer-motion | ^11.15.0 | Drag-and-drop animations | MIT |
| tailwindcss | ^4.2.0 | CSS framework | MIT |
| next-themes | ^0.4.6 | Theme switching | MIT |
| lucide-react | ^0.564.0 | Icon library | ISC |
| @vercel/analytics | 1.6.1 | Analytics | MIT |
| @radix-ui/* (20+) | 1.x-2.x | UI primitives | MIT |
| class-variance-authority | ^0.7.1 | Variant management | Apache-2.0 |
| clsx | ^2.1.1 | Class utilities | MIT |
| tailwind-merge | ^3.3.1 | Class merging | MIT |
| react-hook-form | ^7.54.1 | Form management | MIT |
| @hookform/resolvers | ^3.9.1 | Form validation | MIT |
| zod | ^3.24.1 | Schema validation | MIT |
| sonner | ^1.7.1 | Toast notifications | MIT |
| cmdk | 1.1.1 | Command palette | MIT |
| vaul | ^1.1.2 | Drawer component | MIT |
| recharts | 2.15.0 | Charts | MIT |
| embla-carousel-react | 8.6.0 | Carousel | MIT |
| date-fns | 4.1.0 | Date utilities | MIT |
| react-day-picker | 9.13.2 | Date picker | MIT |
| react-resizable-panels | ^2.1.7 | Resizable panels | MIT |
| input-otp | 1.4.2 | OTP input | MIT |
| autoprefixer | ^10.4.20 | CSS prefixing | MIT |

### Development Dependencies

| Package | Version | Purpose |
|---|---|---|
| typescript | 5.7.3 | Type checking |
| @types/node | ^22 | Node.js types |
| @types/react | 19.2.14 | React types |
| @types/react-dom | 19.2.3 | React DOM types |
| @tailwindcss/postcss | ^4.2.0 | PostCSS integration |
| postcss | ^8.5 | CSS processing |
| tw-animate-css | 1.3.3 | Animation utilities |

## Dependency Risk Notes

- **Unused dependencies**: Several packages installed (recharts, react-hook-form, zod, embla-carousel, cmdk, etc.) are part of the shadcn/ui preset but are not actively used by the current feature set. These add to bundle size unnecessarily.
- **next-themes vs custom ThemeContext**: Two competing theme systems exist — the custom `ThemeContext` and the installed `next-themes` package. This could cause confusion and was likely not intentional.
- **No test dependencies**: No testing framework is installed despite test infrastructure (`data-testid`) being in place.
