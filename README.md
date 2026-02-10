# Kyboo 📚

A modern book exchange platform built with Next.js, allowing students to share and exchange books within their community.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm

## 📋 Prerequisites

- Node.js 18+ and pnpm installed
- Docker and Docker Compose (for database)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd kyboo
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up PostgreSQL with Docker

Start the PostgreSQL container using Docker Compose:

```bash
# Start database in detached mode
docker-compose up -d

# Verify it's running
docker ps

# Check logs if needed
docker logs kyboo-db
```

The `docker-compose.yml` is already configured with:
- **Database:** kyboo_db
- **User:** db_user
- **Password:** db_password
- **Port:** 5432

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Add the following to `.env.local`:

```env
# Database
DATABASE_URL=postgresql://db_user:db_password@localhost:5432/kyboo_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Generate NEXTAUTH_SECRET with:
# openssl rand -base64 32
```

### 5. Run Database Migrations

Push the database schema using Drizzle:

```bash
# Push schema to database
pnpm db:push

# Or run migrations (if you have migration files)
pnpm db:migrate
```

Check your `package.json` for the exact migration commands. Common ones are:
```bash
pnpm drizzle-kit push:pg
# or
pnpm drizzle-kit migrate
```

### 6. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Database Commands

### Basic Operations

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker logs -f kyboo-db

# Restart database
docker-compose restart
```

### Access PostgreSQL CLI

```bash
# Connect to PostgreSQL inside the container
docker exec -it kyboo-db psql -U db_user -d kyboo_db

# Once inside psql, useful commands:
\dt          # List all tables
\d users     # Describe users table
\d books     # Describe books table
SELECT * FROM users;    # Query users
\q           # Exit psql
```

### Database Management

```bash
# Create a database backup
docker exec kyboo-db pg_dump -U db_user kyboo_db > backup.sql

# Restore from backup
docker exec -i kyboo-db psql -U db_user kyboo_db < backup.sql

# View database size
docker exec kyboo-db psql -U db_user -d kyboo_db -c "SELECT pg_size_pretty(pg_database_size('kyboo_db'));"
```

## 📁 Project Structure

```
kyboo/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── (dashboard)/       # Main app pages (home, profile, publish)
│   ├── api/               # API routes (NextAuth)
│   └── test-register/     # Test user registration
├── components/            # React components
│   ├── books/            # Book modal and related
│   ├── feed/             # Feed components
│   ├── layout/           # Sidebar, Navbar
│   ├── profile/          # Profile components
│   └── ui/               # Reusable UI components
├── db/                   # Database configuration
│   └── schema.ts         # Drizzle schema definitions
├── drizzle/              # Database migrations
├── lib/                  # Utility functions
├── server/               # Server actions
│   └── actions/          # Server-side logic
│       ├── auth/         # Authentication actions
│       ├── books/        # Book CRUD operations
│       ├── feed/         # Personalized feed
│       ├── test/         # Test utilities
│       └── user/         # User operations
└── public/               # Static assets
```

## 🗄️ Database Schema

Main tables:
- **users** - User accounts, preferences, and authentication
  - id, studentCode, name, username, password, imageURL, preferences
- **books** - Published books for exchange
  - id, ownerId, title, author, publisher, year, imageUrl, description, genres, status

## 🎨 Features

- ✅ User Authentication (NextAuth.js)
- ✅ Book Publishing with genre selection
- ✅ Personalized Feed based on preferences
- ✅ User Profiles with editable preferences
- ✅ Book Details Modal with edit functionality
- ✅ Dark Mode toggle
- ✅ Responsive Design
- ✅ Infinite scroll feed
- ✅ Image upload support

## 📝 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:push      # Push schema changes to database
pnpm db:studio    # Open Drizzle Studio (database GUI)
```

## 🔧 Drizzle ORM Commands

```bash
# Generate migrations from schema changes
pnpm drizzle-kit generate:pg

# Push schema directly to database (no migration files)
pnpm drizzle-kit push:pg

# Open Drizzle Studio - visual database browser
pnpm drizzle-kit studio

# Apply migrations
pnpm drizzle-kit migrate
```

## 🧪 Testing

For quick testing without SIIAU validation:
- Navigate to `/test-register`
- Create test users with any student code
- Login with created credentials

## 🔐 Security Notes

**NEVER commit these files:**
- `.env.local` or any `.env.*` files
- `node_modules/`
- `.next/` build artifacts

**Before pushing to GitHub:**
```bash
# Run safety check
.\check-safety.ps1

# Or manually verify
git ls-files | grep "\.env"  # Should only show .env.example
```

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check if container is running
docker ps | grep kyboo-db

# Check container logs
docker logs kyboo-db

# Restart database
docker-compose restart

# Verify connection from host
docker exec kyboo-db psql -U db_user -d kyboo_db -c "SELECT version();"
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
pnpm db:push

# Check migration status
pnpm drizzle-kit check

# Force schema push
pnpm db:push --force
```

### Port Already in Use

```bash
# Find process using port 5432
netstat -ano | findstr :5432

# Stop existing PostgreSQL service
# Or change port in docker-compose.yml to 5433:5432
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

[Add your license here]

## 👥 Authors

- Angel Parada Perez
- Cesar Balam Espinosa Nuñez
- Brenda Zamarripa Ramirez

---

**Happy coding! 🚀📚**