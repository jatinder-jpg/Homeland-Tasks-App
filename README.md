# Taskopad Clone

A comprehensive task management and collaboration platform built with [Next.js](https://nextjs.org), designed to streamline project management, team collaboration, and task tracking.

## Project Overview

Taskopad Clone is a full-featured workspace management application that combines task management, document collaboration, team communication, and project analytics in a single unified platform.

### Key Features

- **Dashboard** - Overview and summary of key metrics and daily tasks
- **Task Management** - Kanban board, list view, and calendar view for managing tasks
- **Project Management** - Create and manage projects with detailed views and analytics
- **Team Collaboration** - Discussion channels and messaging for team communication
- **Documents** - File and folder management with sharing capabilities
- **Notes** - Quick notes and note-taking functionality
- **People Directory** - Manage team members and view performance analytics
- **Reports** - Generate and view project and performance reports
- **Settings** - Comprehensive settings for organization, security, billing, and custom fields

## Project Structure

```
app/                  # Next.js app directory with routes
├── (app)/           # Main application routes (dashboard, projects, tasks, etc.)
├── (auth)/          # Authentication routes (sign-in, sign-up, password reset)
└── auth/            # Auth callback routes

components/         # React components organized by feature
├── dashboard/       # Dashboard components
├── task/           # Task management components
├── project/        # Project components
├── discussion/     # Chat and discussion components
├── documents/      # Document management components
├── notes/          # Notes components
├── people/         # People and team components
├── reports/        # Reports components
├── settings/       # Settings components
├── shell/          # Layout and navigation components
└── ui/             # Reusable UI components

lib/                # Utility functions and helpers
├── actions/        # Server actions
├── queries/        # Data queries
├── supabase/       # Supabase integration
├── types/          # TypeScript types
└── utils/          # Utility functions

supabase/           # Database migrations and seed scripts
public/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org) with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom auth implementation with Supabase
- **Code Quality**: ESLint for code linting

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - Component library configuration
- `eslint.config.mjs` - ESLint configuration

## Database

The project uses Supabase for database management. Migration scripts and seed data are available in the `supabase/` directory.

## Deployment

The project is ready to be deployed on [Vercel](https://vercel.com), the platform created by the creators of Next.js.

## Contributing

Contributions are welcome! Please ensure code follows the project's ESLint configuration and TypeScript standards.

## License

This project is part of the Taskopad Clone initiative.
