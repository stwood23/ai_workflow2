# Style Guide

## 1. Typography

### Font Family
- Modern, geometric sans-serif (most likely Poppins, Inter, or Montserrat)
- Clean, friendly, high x-height, rounded edges—emphasizes accessibility and readability.

### Font Weights
- **Headings:** Bold (700+), eye-catching, heavy for emphasis
- **Subheadings/Body:** Regular to Medium (400–500)
- **Navigation/sidebar:** Regular/Medium, with active states in semi-bold

### Size Hierarchy
- Very clear:
  - **Large headlines** (e.g., “From Chaos to Clarity”): `40–56px`, bold
  - **Subhead/section titles:** `24–28px`
  - **Card/task titles:** `18–20px`, bold
  - **Task details/body:** `14–16px`
- Generous line-heights (`120–150%`)

### Letter Spacing
- Neutral, tight (`0 – 0.5px`), avoids wide tracking

## 2. Visual Design / Style Type

### Overall Visual Style
- Neo-morphism inspired, but not heavy; light shadows and soft inner glows
- Card-based layout everywhere: Each element (task, section, major UI component) sits in a pillowy, softly-raised container
- Subtle gradients (especially in buttons, backgrounds)
- Vibrant but soft color palette: Primarily soft whites, pale lavenders, pastel blues; accents in indigo, purple, blush, and sky blue
- Obsessive use of rounded corners: All containers, cards, and even outer frames have very high border radii (`20–30px`)
- Soft drop shadows (low opacity, large blur, slightly cool tone) to float cards above the background
- Minimalistic iconography with a line/style matching the font (rounded, playful, simple)

## 3. Spacing & Layout

### Whitespace
- VERY generous whitespace—breathable and uncluttered.
- Cards have at least `16–24px` padding inside and `16+px` outside from each other.
- Sidebar separated by a wide margin from content (`32–48px` gutter).

### Sections
- Visually separated with extra white or pastel padding, helping the eye distinguish between task states (Upcoming, In Progress, Done).
- Everything is grid-aligned (cards are evenly spaced and height-matched, forming columns).

### Navigation
- Sidebar on the left is distinct with a pale background, strong shadow, and curved right corner
- Navigation icons are line-based, not filled, sized to match text
- Active sidebar item: highlighted with a pill-shaped, filled background and increased font weight/color
<!--
### Avatar/Teams Display
- Team avatars presented in small, perfectly rounded images, tightly overlapped with a slight border for clarity.
- Emphasizes collaboration and personality; emoji-like avatars add a playful, humanizing touch. -->

## 4. Color Palette

### Foundational
- **Background:** White or very pale pastel lavender/blue (`#F7F8FC`, `#ECECFC`)
- **Section/Column Backgrounds:** Muted pastel accent (very light blue/lavender, low chroma)
- **Cards:** Pure white, with soft shadow for depth

### Accents/Highlights
- **Primary:** Medium-to-dark indigo/purple (`#4945FF`) for primary text, key buttons
- **Secondary/Label:** Peach, coral, pale teal (`#FCA48C`, `#7EE0D5`, `#F67884`) for task labels/difficulty badges (using soft, colored dots or bars)
- **CTAs:** Smooth purple/blue gradients (`#684AEF` → `#8A7CFF`) for buttons with gentle transition
- **Text:** Very dark navy, almost black (`#23203A`) for high contrast
- **Inactive/Muted:** Medium cool gray (`#A2A2A2`, `#C5C7CD`) for labels/hints

### Gradients
- Hero backgrounds include soft, harmonious pastel gradients (e.g., pale pink to blue-lavender, echoing the sky in the hero panel)

## 5. Buttons & Inputs

### Buttons
- Heavily rounded (`24px+` radii), pill-shaped, large horizontal padding (`24–40px`)
- Gradients or strong, flat color fills
- White, bold sans-serif text, medium size (`18px`)
- Soft, blurred drop shadows; hover state slightly intensifies the color

### Search/Input
- Rounded, subtle border (no harsh lines), soft shadow
- Icon inside (left or right), minimalist placeholder

## 6. Additional Features

### Shadow
- All cards and most conspicuous containers have soft box-shadows:
  - Example: `box-shadow: 0 8px 32px rgba(84, 77, 227, 0.08);`

### Icon Use
- All icons (sidebar, status) follow a line-style, maintaining a playful but professional look

### Task Status Labeling
- Use pastel badges/dots (“High/Medium/Low”)—easy to distinguish at a glance but not visually noisy

### Micro-interactions (not seen, but implied)
- Smooth transitions, subtle scaling/softening on hover and tap

## 7. Example CSS Extracts

```css
body {
  font-family: 'Poppins', 'Inter', 'Montserrat', Arial, sans-serif;
  background: #F7F8FC;
  color: #23203A;
}

.card {
  background: #FFF;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(84, 77, 227, 0.08);
  padding: 24px;
  margin-bottom: 16px;
}

.section-header {
  color: #A2A2A2;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 24px;
}

.button-primary {
  background: linear-gradient(90deg, #684AEF 0%, #8A7CFF 100%);
  border-radius: 24px;
  color: #FFF;
  font-weight: 700;
  font-size: 18px;
  padding: 16px 32px;
  box-shadow: 0 4px 24px rgba(84, 77, 227, 0.16);
  outline: none;
  border: none;
  transition: background 0.2s, box-shadow 0.2s;
}

.button-primary:hover {
  background: linear-gradient(90deg, #6D63FF 0%, #A084FF 100%);
  box-shadow: 0 8px 32px rgba(84, 77, 227, 0.24);
}
```

## TL;DR STYLE SUMMARY

- **Font:** Soft modern geometric sans-serif (Poppins/Inter)
- **Colors:** Soft whites & pastels, bold purple/indigo accent, subtle gradients
- **Cards:** Rounded, softly shadowed (neomorphism light), high padding
- **Sections:** Clear visual separation, generous spacings
- **Avatars/UI icons:** Emoji/circle, playful, overlapping
- **Navigation:** Minimal, line icons, bold highlight for active item
- **Buttons:** Pill-shaped, bold, gradient, gentle shadows
- **General vibe:** Modern, calming, playful yet professional, highly readable, and ultra-clean
