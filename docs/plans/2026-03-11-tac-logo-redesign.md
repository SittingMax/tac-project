# TAC Branding & Logo Redesign

## Objective
Elevate the "Tapan Associate Cargo" (TAC) logo from a generic placeholder to a flagship, 10/10 avant-garde visual identity.

## Strategic Approach: Geometric Minimalism & High-Contrast Typography
Given the blank canvas to "do what is best for the project," we will pursue an ultra-premium, minimalist aesthetic that drops the literal "cardboard box" metaphor in favor of structural geometry representing precision, network architecture, and speed.

### 1. The Emblem (The Icon)
We will replace the generic `lucide-react` Box with a bespoke, CSS/SVG coded geometric mark.
*   **Concept**: Two interlocking minimalist shapes—perhaps a bold forward-slanted wedge intersecting a strict right angle. It represents movement (Aero/Surface) meeting structure (Warehousing/Trust).
*   **Execution**: Sharp 1px and 2px stroke lines, utilizing the primary brand color, with no rounded corners to maintain the razor-sharp aesthetic of the portal.

### 2. The Typography (The Monogram & Subtitle)
*   **Main Monogram ("TAC")**: High-contrast, bold, tightened kerning. It must stand as a formidable structural block.
*   **Subtitle ("TAPAN ASSOCIATE CARGO")**: Transformed from standard text into an ultra-small (`text-[9px]`), extensive letter-spaced monospace font. It will serve as an elegant, technical anchor line beneath the main monolithic "TAC".

### 3. Component Architecture (`tac-logo.tsx`)
*   Refactor the `TacLogoProps` to retain flexible sizing (`sm`, `md`, `lg`) but rebuild the internal DOM structure.
*   Remove `Box` and inject the custom geometric SVG.
*   Implement strict structural flexbox styling to ensure perfect pixel alignment between the emblem, the monogram, and the subtitle.
