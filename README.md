# SSA Logistics Website

A modern, professional website for SSA LOGISTICS LIMITED, a company that specializes in vehicle handling, storage, and delivery in Tanzania as an authorized agent of the Tanzania Port Authority.

## Features

- Professional, modern design reflecting the company's role in logistics
- Responsive layout for all devices
- Information pages: Home, About, Services, FAQ, Contact
- Document Verification Portal for customers to upload and track documents
- Vehicle tracking capabilities
- Supabase integration for authentication and database

## Tech Stack

- **Frontend**: Next.js with JavaScript
- **Styling**: Tailwind CSS
- **Database**: Supabase for document storage and user authentication

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm (or yarn/pnpm)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/ssalogistics.git
   cd ssalogistics
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router files
  - `page.js` - Homepage
  - `about/` - About Us page
  - `services/` - Services page
  - `faq/` - FAQ page
  - `contact/` - Contact page
  - `portal/` - Document Verification Portal
  - `components/` - Reusable UI components
  - `lib/` - Utility functions and Supabase integration

## Deployment

The website can be deployed using Vercel (recommended for Next.js applications):

1. Push your code to a GitHub repository
2. Connect to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy

## Supabase Setup

This project uses Supabase for authentication and database functionality. To set up your Supabase project:

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Create the following tables:
   - `documents` - For storing document metadata
   - `vehicles` - For tracking vehicles

3. Enable Storage for document uploads
4. Set up authentication providers as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.
