## ADDED Requirements

### Requirement: Design tokens file
The system SHALL maintain a design tokens file (`frontend/design-tokens.ts`) exporting the brand color palette, typography scale, spacing scale, shadow definitions, border-radius tokens, and animation presets.

#### Scenario: Tokens consumed by Tailwind config
- **WHEN** the TailwindCSS config is built
- **THEN** the design tokens SHALL be imported into `tailwind.config.ts` to extend the theme with brand-specific values

### Requirement: Brand color palette
The system SHALL define a warm, earthy color palette with: primary (warm terracotta/burnt orange #D4631D), secondary (forest green #2D6A4F), accent (golden #E9B949), neutral (stone tones), and semantic colors (success, error, warning, info).

#### Scenario: Color consistency
- **WHEN** any customer-facing component renders
- **THEN** all colors used SHALL reference design token values, not arbitrary hex codes or Tailwind defaults

### Requirement: Typography scale
The system SHALL define a typography scale using the Manrope font family with predefined sizes: display (48-64px), heading (24-36px), subheading (18-20px), body (14-16px), caption (12px), and overline (10-11px, uppercase).

#### Scenario: Text rendering
- **WHEN** any text element renders
- **THEN** the font size, weight, and line-height SHALL match one of the predefined typography tokens

### Requirement: TailwindCSS build-time migration
The system SHALL replace the TailwindCSS CDN `<script>` tag in `index.html` with a proper PostCSS + TailwindCSS build-time integration configured in `tailwind.config.ts` and `postcss.config.js`.

#### Scenario: Build produces optimized CSS
- **WHEN** `npm run build` is executed
- **THEN** the output CSS SHALL only include used utility classes (tree-shaken) and be significantly smaller than the CDN version

#### Scenario: Development hot reload
- **WHEN** a developer runs `npm run dev` and edits a TailwindCSS class
- **THEN** the change SHALL be reflected immediately via Vite HMR without full page reload

### Requirement: Component variant system
The system SHALL define reusable component variants for buttons (primary, secondary, outline, ghost), cards (product, testimonial, blog), and badges (category, status, tag) using Tailwind's `@apply` or className composition patterns.

#### Scenario: Button variants
- **WHEN** a button component renders with variant="primary"
- **THEN** the button SHALL use the primary brand color with consistent padding, border-radius, font-weight, and hover/active states matching the design system
