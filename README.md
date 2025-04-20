<<<<<<< HEAD
# FundSol - Solana Fundraising Platform

FundSol is a GoFundMe-style fundraising platform built on Solana, leveraging Solana's fast and low-cost transactions to create an efficient crowdfunding experience.

## Features

- 🔐 Secure wallet connection using Solana wallets
- 💰 Create and manage fundraising campaigns
- 📊 Track campaign donations and progress
- 🔍 Browse campaigns by category
- 📝 Rich content support with Markdown for campaign descriptions
- 🌐 Custom campaign URLs with slugs
- 🤝 Easy donation process using Solana 

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Turso (libsql)
- **Blockchain**: Solana Web3.js
- **Form Handling**: React Hook Form + Zod validation
- **Content Rendering**: React Markdown

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Solana wallet (Phantom, Backpack, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fundsol.git
   cd fundsol
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
```bash
npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Initialize the database by visiting [http://localhost:3000/api/init](http://localhost:3000/api/init) once.

## Project Structure

```
fundsol/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── campaigns/      # Campaign-related API endpoints
│   │   └── init/           # Database initialization endpoint
│   ├── campaigns/          # Campaign pages
│   │   └── [slug]/         # Individual campaign page
│   ├── create/             # Create campaign page
│   ├── dashboard/          # User dashboard page
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── ui/                 # UI components from shadcn
│   ├── navbar.tsx          # Navigation bar
│   └── donate-button.tsx   # Donation button with modal
├── lib/                    # Utility functions and shared code
│   ├── db.ts               # Database client and schema
│   ├── providers.tsx       # Context providers
│   ├── utils.ts            # Helper utilities
│   └── validations.ts      # Zod validation schemas
└── public/                 # Static files
```

## Database Schema

The application uses three main tables:

1. **campaigns** - Stores fundraising campaign information
2. **donations** - Records donations made to campaigns
3. **users** - Stores user information linked to wallet addresses

## Roadmap

- [ ] Integration with Solana wallet adapters
- [ ] Real-time donation processing
- [ ] Campaign updates/posts feature
- [ ] Email notifications
- [ ] Campaign search functionality
- [ ] Social sharing
- [ ] Campaign verification badges

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Solana](https://solana.com/)
- [Turso](https://turso.tech/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
=======
# fundsol
>>>>>>> f8117e2b2f0cf13baa6f664d46f1d4beccc74983
