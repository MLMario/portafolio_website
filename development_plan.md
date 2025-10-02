# Data Scientist Portfolio Website - Development Plan

## 1. Project Overview

A modern, full-stack portfolio website for showcasing Data Science projects with an admin interface for content management and AI-powered chat functionality for project exploration.

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15.5+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style)
- **State Management**: React Context API + Zustand (for complex state, install as needed)
- **Markdown Rendering**: react-markdown + remark-gfm + remark-math + rehype-katex
- **Presentation Embedding**: iframe for Gamma presentations

### Backend
- **Framework**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (for markdown files, images, and assets)

### AI Chat
- **Strategy**: Full Context + Vision with Prompt Caching (no RAG needed for MVP)
- **LLM**: Anthropic Claude 3.5 Sonnet (with vision support)
- **Prompt Caching**: Anthropic's ephemeral caching (90% cost reduction)
- **Image Processing**: Extract and send images from markdown to vision model
- **Chat UI**: Custom component with shadcn/ui primitives
- **Cost**: ~$0.005-0.02 per conversation (with caching)

### Deployment
- **Platform**: Vercel (optimal for Next.js)
- **CI/CD**: GitHub Actions + Vercel Git Integration
- **All-in-One Backend**: Supabase (Database + Auth + Storage)

## 3. Architecture Design

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  Public Pages          │  Admin Dashboard  │  AI Chat        │
│  - Home/Portfolio      │  - Login          │  - Chat UI      │
│  - Project List        │  - Project CRUD   │  - Vision       │
│  - Project Summary     │  - File Upload    │  - Streaming    │
│  - Project Details     │  - Preview        │                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)            │
├─────────────────────────────────────────────────────────────┤
│  /api/projects         │  /api/admin       │  /api/chat      │
│  /api/auth             │  /api/upload      │  (Full Context) │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
         ┌──────────────┐          ┌──────────────┐
         │   Supabase   │          │   Anthropic  │
         │ - PostgreSQL │          │   Claude API │
         │ - Auth       │          │ - Vision     │
         │ - Storage    │          │ - Caching    │
         └──────────────┘          └──────────────┘
```

### 3.2 Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Project {
  id              String    @id @default(cuid())
  title           String
  slug            String    @unique
  description     String
  thumbnail       String?   // Supabase Storage URL
  tags            String[]
  category        String?
  gammaUrl        String    // Gamma presentation embed URL
  markdownFileUrl String    // Supabase Storage URL
  markdownContent String    @db.Text // Cached markdown content for chat
  imageUrls       String[]  // Array of Supabase Storage URLs for charts/figures
  isPublished     Boolean   @default(false)
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  viewCount       Int       @default(0)

  chatSessions    ChatSession[]
}

model ChatSession {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sessionId   String    @unique
  messages    Json      // Array of {role, content, timestamp}
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([projectId])
}
```

## 4. Feature Implementation Details

### 4.1 Public Portfolio Interface

#### Home Page (`/`)
- Hero section with your introduction and expertise areas
- Featured projects grid (3-4 highlighted projects)
- Skills/Technologies section
- Contact/Social links
- Call-to-action to explore projects

#### Projects List Page (`/projects`)
- Grid/List view of all published projects
- Filtering by tags/categories
- Search functionality
- Sort options (date, views, alphabetical)
- Project cards showing: thumbnail, title, description, tags

#### Project Summary Page (`/projects/[slug]`)
- Embedded Gamma presentation (full-screen capable)
- Project metadata (title, description, tags, date)
- Navigation buttons: "View Detailed Analysis" → markdown page
- Share buttons

#### Project Details Page (`/projects/[slug]/details`)
- Rendered markdown content with:
  - Syntax highlighting (for code blocks)
  - Math equation support (KaTeX)
  - Image/chart rendering
  - Table formatting
- AI Chat widget (sticky sidebar or bottom-right)
- Table of contents (generated from headings)
- Navigation: Back to summary, Next/Previous project

### 4.2 Admin Dashboard

#### Authentication (`/admin/login`)
- Secure login with Supabase Auth
- Session management via Supabase
- Email/password authentication

#### Project Management (`/admin/projects`)
- Table view of all projects (published & drafts)
- Quick actions: Edit, Delete, Toggle Publish, Preview
- Bulk operations

#### Create/Edit Project (`/admin/projects/new`, `/admin/projects/[id]/edit`)
- Form with fields:
  - Title (auto-generates slug)
  - Description (textarea)
  - Tags (multi-select or chip input)
  - Category (dropdown)
  - Thumbnail upload (to Supabase Storage)
  - Gamma presentation URL
  - Markdown file upload (to Supabase Storage)
  - Project images/charts upload (to Supabase Storage)
- Live preview panel
- Auto-save drafts
- Publish/Unpublish toggle
- On save: Extract image references, upload to Supabase, cache markdown content

#### File Management
- Drag-and-drop markdown file upload
- Image upload for thumbnails
- Asset management for markdown images

### 4.3 AI Chat System

#### Architecture: Full Context + Vision with Prompt Caching

**Why this approach?**
- Simple to implement (no vector database needed)
- AI can see ALL charts, figures, and visualizations
- 90% cost reduction via Anthropic's prompt caching
- Perfect for portfolio size (5-30 projects)
- Each project doc typically <30k tokens
- Claude has 200k token context window

**Workflow:**

1. **Preprocessing** (on project save):
   - Upload markdown file to Supabase Storage
   - Extract all image references from markdown
   - Upload images to Supabase Storage
   - Store markdown content and image URLs in database
   - Calculate token count for optimization

2. **Runtime** (user query):
   - Retrieve project markdown + all image URLs from database
   - Load images as base64 from Supabase Storage
   - Send to Claude 3.5 Sonnet with vision:
     - Cached content: Full markdown + all images (90% cheaper on subsequent requests)
     - User query + chat history
   - Stream response back to UI
   - First visitor: ~$0.05, subsequent visitors: ~$0.005

3. **Caching Strategy**:
   - Project content (markdown + images) cached for 5 minutes
   - Active browsing sessions benefit from 90% cost reduction
   - Cache automatically refreshed per project

#### Chat UI Components
- Message list (user/assistant messages)
- Input field with send button
- Typing indicators
- Suggested questions (generated from content)
- Clear/Reset conversation
- Copy code blocks
- Markdown rendering in responses

#### System Prompt Template
```
You are an AI assistant helping users understand a Data Science project.
You have access to the complete project documentation including all charts,
figures, and visualizations. Answer questions based solely on the provided
documentation. If information isn't available, politely say so.

Project: {project_title}

You can see all the charts and figures in this project. Reference them
when explaining results, model performance, or data insights.

Answer questions accurately and concisely.
```

#### Chat Implementation Example
```typescript
// api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const { projectId, message, chatHistory } = await req.json();

  // Get project with markdown and images
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  // Load images from Supabase Storage
  const images = await Promise.all(
    project.imageUrls.map(url => loadImageAsBase64(url))
  );

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Project Documentation:\n\n${project.markdownContent}`,
            cache_control: { type: 'ephemeral' } // Cache for 5 minutes
          },
          ...images.map(img => ({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType,
              data: img.base64
            },
            cache_control: { type: 'ephemeral' } // Cache images too
          })),
          ...chatHistory,
          {
            type: 'text',
            text: message
          }
        ]
      }
    ],
  });

  return new Response(stream.toReadableStream());
}
```

## 5. Project Structure

```
portfolio-website/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                 # Home page
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx             # Projects list
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx         # Project summary (Gamma)
│   │   │   │       └── details/
│   │   │   │           └── page.tsx     # Project details (Markdown)
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   └── contact/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx               # Admin layout with auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── projects/
│   │   │       ├── page.tsx             # Project list
│   │   │       ├── new/
│   │   │       │   └── page.tsx
│   │   │       └── [id]/
│   │   │           └── edit/
│   │   │               └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts         # Supabase auth callback
│   │   │   ├── projects/
│   │   │   │   ├── route.ts             # GET all, POST create
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts         # GET, PUT, DELETE
│   │   │   ├── chat/
│   │   │   │   └── route.ts             # POST streaming chat (full context)
│   │   │   └── upload/
│   │   │       └── route.ts             # File upload to Supabase Storage
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectGrid.tsx
│   │   │   ├── ProjectFilter.tsx
│   │   │   └── GammaEmbed.tsx
│   │   ├── markdown/
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   └── TableOfContents.tsx
│   │   ├── chat/
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── SuggestedQuestions.tsx
│   │   └── admin/
│   │       ├── ProjectForm.tsx
│   │       ├── FileUpload.tsx
│   │       └── MarkdownEditor.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── supabase.ts                  # Supabase client
│   │   ├── anthropic.ts                 # Claude client
│   │   ├── markdown.ts                  # Markdown utilities + image extraction
│   │   ├── image-processor.ts           # Image loading/base64 conversion
│   │   └── utils.ts                     # General utilities
│   ├── types/
│   │   └── index.ts
│   └── config/
│       └── site.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── images/
│   └── icons/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 6. Development Phases

### Phase 1: Foundation (Week 1)
- [x] Initialize Next.js project with TypeScript
- [x] Set up Tailwind CSS and shadcn/ui
- [x] Install core dependencies (@anthropic-ai/sdk, @prisma/client, @supabase/supabase-js, react-markdown, etc.)
- [ ] Install additional dependencies (remark-gfm for GitHub Flavored Markdown)
- [ ] Set up Supabase project (database + storage + auth)
- [ ] Configure Prisma with Supabase PostgreSQL
- [ ] Create database schema and run migrations
- [ ] Set up Supabase Storage buckets (projects, images, thumbnails)
- [ ] Create folder structure (components/, lib/, types/, etc.)
- [ ] Configure environment variables (.env.local)

### Phase 2: Public Interface (Week 2)
- [ ] Build home page layout
- [ ] Create projects list page with filtering
- [ ] Implement project summary page (Gamma embed)
- [ ] Implement project details page (Markdown rendering)
- [ ] Add navigation and routing
- [ ] Implement responsive design

### Phase 3: Admin Dashboard (Week 3)
- [ ] Set up Supabase Auth for admin access
- [ ] Create admin login page
- [ ] Build project management table
- [ ] Create project form (add/edit)
- [ ] Implement file upload to Supabase Storage (markdown + images)
- [ ] Add markdown editor/preview
- [ ] Implement image extraction from markdown
- [ ] Test CRUD operations with file storage

### Phase 4: AI Chat Integration (Week 4)
- [ ] Set up Anthropic Claude API client
- [ ] Implement image extraction and loading from Supabase
- [ ] Create chat API endpoint with streaming + prompt caching
- [ ] Build chat UI components
- [ ] Implement full-context chat with vision
- [ ] Add suggested questions generation
- [ ] Test chat with sample projects (text + images)
- [ ] Verify prompt caching reduces costs

### Phase 5: Polish & Deploy (Week 5)
- [ ] Add loading states and error handling
- [ ] Implement SEO optimization (metadata, sitemap)
- [ ] Add analytics (optional)
- [ ] Performance optimization (image optimization, code splitting)
- [ ] Security audit (environment variables, API protection)
- [ ] Write documentation
- [ ] Deploy to Vercel
- [ ] Test in production

## 7. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase (Database + Auth + Storage)
DATABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-..."

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Note**: Never commit `.env.local` to git. Create `.env.example` with placeholder values for reference.

## 8. Key Implementation Considerations

### Security
- Admin routes protected with middleware
- API routes require authentication for mutations
- Input validation on all forms
- SQL injection prevention via Prisma
- XSS prevention in markdown rendering
- Rate limiting on API endpoints (especially chat)
- Secure file upload validation

### Performance
- Image optimization (Next.js Image component)
- Code splitting by route
- Lazy loading for chat widget
- Caching strategies (ISR for project pages)
- Vector search optimization
- Database indexing

### UX Enhancements
- Skeleton loaders during data fetching
- Optimistic UI updates in admin panel
- Toast notifications for actions
- Keyboard shortcuts in admin
- Mobile-responsive chat widget
- Accessibility (ARIA labels, keyboard navigation)

### Scalability
- Serverless API routes scale automatically
- Supabase handles scaling of database and storage
- Prompt caching reduces AI costs by 90% for active sessions
- CDN for static assets (Vercel Edge Network)
- Database connection pooling via Prisma
- Pagination for project lists
- Can add RAG later if projects grow beyond 50+ or docs exceed 100k tokens

## 9. AI Chat: Why Full Context + Vision?

### Advantages Over RAG for Portfolio Use Case
1. **Simplicity**: No vector database, embeddings, or chunking needed
2. **Vision Support**: AI can see and analyze all charts, figures, and visualizations
3. **Full Context**: Never misses information across chunks
4. **Cost Effective**: With prompt caching, costs ~$0.005 per conversation after first request
5. **Fast to Implement**: 1-2 days vs 3-4 days for RAG
6. **Perfect Scale**: Ideal for 5-30 projects with typical DS documentation

### When to Migrate to RAG
Consider adding RAG if:
- You have 50+ projects
- Individual project docs exceed 100k tokens
- You need sub-100ms response times
- Monthly AI costs exceed $100

### Cost Comparison (for 1000 conversations/month)
- **Full Context (first request)**: ~$50/month
- **Full Context (with caching)**: ~$5-10/month (most requests cached)
- **RAG**: ~$10-15/month + $70/month vector DB = ~$85/month
- **Winner**: Full Context with Caching 🎉

### Technology Stack Rationale
- **Supabase**: All-in-one (database + auth + storage) - simpler than juggling multiple services
- **Anthropic Claude**: Best-in-class vision + long context + prompt caching
- **Vercel**: Seamless Next.js deployment with edge network

## 10. Success Metrics

- Fast page loads (<2s)
- Mobile responsive on all devices
- Admin can add new project in <5 minutes
- AI chat responds accurately to project questions
- 95%+ uptime
- SEO optimized (project pages indexable)

## 11. Next Steps

1. ✅ Review and approve this plan
2. ✅ Initialize Next.js project with TypeScript, Tailwind, and shadcn/ui
3. ✅ Install core dependencies
4. **Current Phase: Complete Phase 1 Foundation**
   - [ ] Install `remark-gfm` for GitHub Flavored Markdown support
   - [ ] Set up Supabase account and project
   - [ ] Get Anthropic API key
   - [ ] Configure Prisma with Supabase
   - [ ] Create database schema
   - [ ] Set up environment variables
5. Set up accounts (if not done):
   - [ ] Supabase (free tier to start)
   - [ ] Anthropic API (get API key)
   - [ ] Vercel (connect GitHub - for deployment later)
6. Begin Phase 2 development (Public Interface)
7. Iterate with regular reviews after each phase

---

## 12. Quick Reference: Key Decisions

| Aspect | Technology | Rationale |
|--------|-----------|-----------|
| **Database** | Supabase PostgreSQL | All-in-one: DB + Auth + Storage |
| **AI Chat** | Full Context + Vision | Simple, supports charts, cost-effective with caching |
| **AI Model** | Claude 3.5 Sonnet | Best vision + long context + caching |
| **Auth** | Supabase Auth | Built-in, no extra service |
| **Storage** | Supabase Storage | Integrated with database |
| **Deployment** | Vercel | Best for Next.js |
| **No RAG?** | Not needed initially | Can add later if scaling requires it |

**Estimated Total Development Time**: 4-5 weeks for full implementation
**Recommended Approach**: Start with Phases 1-2 for MVP, then add admin and AI features
**Expected Monthly Costs**: ~$5-20 for AI + Supabase free tier (scales as needed)

This architecture provides a production-ready, scalable solution optimized for a Data Science portfolio with visual content. The full-context approach with vision ensures visitors can ask about any chart or figure in your projects.