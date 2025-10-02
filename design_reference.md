# Design Reference - Portfolio Website

**Reference**: [Lanre Akinbo's Portfolio](https://lanre-akinbo.github.io/portfolio/#projects)

## ✅ Key Design Elements to Adopt

### 1. **Layout & Structure**
- ✅ **Single-page scrolling** design with smooth anchor navigation
- ✅ **Clean, minimalist** aesthetic
- ✅ **Section-based** organization:
  - Hero/Introduction
  - Skills/Proficiencies (visual icons)
  - Projects (grid layout)
  - Contact/Links

### 2. **Color Scheme**
- Professional, modern palette
- Likely neutral base (white/light gray backgrounds)
- Accent colors for CTAs and interactive elements
- Clean, high contrast for readability

### 3. **Typography**
- Bold, clear headings
- Clean sans-serif font throughout
- Good hierarchy: H1 → H2 → Body text
- Emphasis on readability

### 4. **Navigation**
- Top navigation bar with section anchors
- Smooth scroll to sections
- Clean, minimal navigation design
- Mobile-responsive hamburger menu (implied)

### 5. **Projects Section**
- **Grid layout** for project cards
- Each card includes:
  - Project thumbnail/image
  - Title
  - Brief description
  - "View Project" CTA button
- Consistent card design
- Hover states for interactivity

### 6. **Visual Elements**
- Circular profile image
- Icon-based skill representations
- Consistent spacing and padding
- Visual breaks between sections

### 7. **Interactive Components**
- Clickable project cards
- Smooth transitions
- Form inputs for contact
- Social/platform links with icons

### 8. **User Experience**
- Progressive information disclosure
- Easy-to-scan content
- Mobile-first responsive design
- Fast loading, minimal animations
- Clear CTAs throughout

---

## 🎨 Implementation Plan for Our Portfolio

### Differences from Reference (Per Our Architecture)

| Aspect | Reference Site | Our Implementation |
|--------|---------------|-------------------|
| **Navigation** | Single-page scroll | Multi-page (/, /projects, /projects/[slug]) |
| **Project Detail** | Modal/popup | Separate detail pages (Gamma + Markdown) |
| **Content** | Static HTML | Dynamic from Supabase DB |
| **Admin** | Manual code updates | Admin dashboard for CRUD |
| **AI Chat** | Not present | AI chat on detail pages |

### What We'll Keep from Reference

1. ✅ **Homepage Design**:
   - Hero section with introduction
   - Skills/expertise section with icons
   - Featured projects grid
   - Contact/social links section

2. ✅ **Visual Style**:
   - Clean, professional aesthetic
   - Card-based project layout
   - Minimalist color palette
   - Bold typography hierarchy

3. ✅ **Projects Grid**:
   - Thumbnail images
   - Title + description
   - "View Project" buttons
   - Hover effects

4. ✅ **Responsive Design**:
   - Mobile-first approach
   - Grid adapts to screen size
   - Touch-friendly on mobile

### Our Unique Additions

1. 🆕 **Separate Project Pages**:
   - Summary page (Gamma presentation)
   - Detail page (Markdown with AI chat)

2. 🆕 **Category Filtering**:
   - Filter by: article, analysis, tutorial, software_implementation, other
   - Tag-based filtering

3. 🆕 **AI Chat Widget**:
   - Sticky sidebar/bottom-right
   - Context-aware help

4. 🆕 **Admin Dashboard**:
   - Easy project management
   - File uploads

---

## 📐 Component Design Specifications

### Homepage Sections

#### 1. Hero Section
```
┌─────────────────────────────────────┐
│                                     │
│         [Profile Image]             │
│                                     │
│       Your Name                     │
│       Data Scientist                │
│                                     │
│       Brief introduction text       │
│                                     │
│   [View Projects] [Contact]         │
│                                     │
└─────────────────────────────────────┘
```

#### 2. Skills Section
```
┌─────────────────────────────────────┐
│          Skills & Expertise         │
│                                     │
│  [Icon]  [Icon]  [Icon]  [Icon]     │
│   ML      DL      NLP      CV       │
│                                     │
│  Python • R • SQL • TensorFlow      │
└─────────────────────────────────────┘
```

#### 3. Featured Projects (Grid)
```
┌───────────┬───────────┬───────────┐
│ [Image]   │ [Image]   │ [Image]   │
│ Title     │ Title     │ Title     │
│ Desc...   │ Desc...   │ Desc...   │
│ [View] →  │ [View] →  │ [View] →  │
├───────────┼───────────┼───────────┤
│ [Image]   │ [Image]   │ [Image]   │
│ Title     │ Title     │ Title     │
│ Desc...   │ Desc...   │ Desc...   │
│ [View] →  │ [View] →  │ [View] →  │
└───────────┴───────────┴───────────┘
```

#### 4. Contact Section
```
┌─────────────────────────────────────┐
│           Get In Touch              │
│                                     │
│  [GitHub] [LinkedIn] [Email]        │
│                                     │
│         [Contact Form]              │
└─────────────────────────────────────┘
```

---

## 🎨 shadcn/ui Components to Use

Based on reference design:
- **Card** - Project cards, skill cards
- **Button** - CTAs, navigation
- **Badge** - Tags, categories
- **Avatar** - Profile image
- **Separator** - Section dividers
- **Hover Card** - Project previews
- **Dialog** - Potential modals
- **Form** - Contact form

---

## 📝 Notes for Phase 2 Implementation

### Home Page (/)
1. Use reference design for layout inspiration
2. Keep our multi-page architecture
3. Featured projects → link to `/projects/[slug]`
4. Maintain clean, professional aesthetic

### Projects List (/projects)
1. Similar grid to reference
2. Add filtering by category
3. Add search functionality
4. Maintain card-based design

### Project Detail Pages
1. **Different from reference** - full pages instead of modals
2. Summary page: Gamma embed + metadata
3. Details page: Markdown + AI chat widget

### Design System
- Use Tailwind utilities for spacing/layout
- shadcn/ui components for consistency
- Keep reference's minimalist aesthetic
- Ensure responsive on all devices

---

## ✅ Summary

**DO**:
- Use reference for visual design, layout, and UX patterns
- Adopt clean, minimalist aesthetic
- Implement similar homepage sections
- Use grid-based project display
- Maintain professional color scheme

**DON'T**:
- Change our architecture (multi-page, database-driven)
- Remove planned features (AI chat, admin, Gamma presentations)
- Make it single-page only
- Lose our unique value propositions

**Result**: A beautiful, professional portfolio that combines the reference's clean design with our advanced features (AI chat, dynamic content, admin dashboard).
