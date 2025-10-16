# Database Setup & Migrations

This project uses **Supabase CLI** for database migrations to ensure consistent schema across environments.

## Prerequisites

1. **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
2. **Node.js** - Version 16 or higher

## Initial Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### 2. Link to Your Supabase Project

**Option A: Link to existing remote project**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>
```

You can find your project ref in your Supabase dashboard URL:
`https://app.supabase.com/project/<your-project-ref>`

**Option B: Start local development (no remote needed)**
```bash
# Start local Supabase (requires Docker)
supabase start
```

### 3. Run Migrations

**For Remote (Production/Staging):**
```bash
# Push all migrations to remote database
supabase db push
```

**For Local Development:**
```bash
# Reset local database and run all migrations
supabase db reset

# Or just run new migrations
supabase migration up
```

### 4. Verify Migration

Check that all tables were created:
```bash
# Run on local database
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

You should see: `profiles`, `recordings`, `likes`

## Creating New Migrations

When you need to make database changes:

```bash
# Create a new migration file
supabase migration new <migration_name>

# Example:
supabase migration new add_user_settings_table
```

This creates: `supabase/migrations/<timestamp>_add_user_settings_table.sql`

Edit the file with your SQL changes, then:
```bash
# Apply locally
supabase db reset

# When ready, push to remote
supabase db push
```

## Migration Files

Current migrations (run in order):

1. **`20250101000000_initial_schema.sql`**
   - Creates `profiles`, `recordings`, `likes` tables
   - Sets up Row Level Security (RLS) policies
   - Creates triggers for auto-updating likes count
   - Creates trigger for auto-creating user profiles

2. **`20250102000000_add_recordings_profile_fk.sql`**
   - Adds foreign key: `recordings.user_id → profiles.id`
   - Enables joining recordings with user profile data

## Common Commands

```bash
# Start local Supabase (requires Docker)
supabase start

# Stop local Supabase
supabase stop

# View local database status
supabase status

# Reset local database (drops all data, reruns migrations)
supabase db reset

# Create database diff (compare local vs remote)
supabase db diff

# Push migrations to remote
supabase db push

# Pull remote schema changes to local
supabase db pull

# Generate TypeScript types from database
supabase gen types typescript --local > src/lib/database.types.ts
```

## Troubleshooting

### Migration fails with "relation already exists"

This usually happens when applying migrations to an existing database:

```bash
# Option 1: Reset local database
supabase db reset

# Option 2: Drop the specific table first (BE CAREFUL!)
supabase db execute "DROP TABLE IF EXISTS <table_name> CASCADE;"
supabase db reset
```

### Local Supabase won't start

Make sure Docker is running:
```bash
# Check Docker status
docker ps

# If Docker not running, start it first
```

### Can't connect to remote database

Verify your project ref and credentials:
```bash
# Re-link to project
supabase link --project-ref <your-project-ref>
```

## Environment Setup

After running migrations, make sure your `.env` file has:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

Get these from your Supabase dashboard: **Settings → API**

## CI/CD Integration

For automated deployments, add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Supabase migrations
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  run: |
    npm install -g supabase
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    supabase db push
```

## Best Practices

1. **Never edit migration files after they've been applied** - Create a new migration instead
2. **Test migrations locally first** - Always run `supabase db reset` locally before pushing
3. **Keep migrations atomic** - One migration = one logical change
4. **Use descriptive names** - `add_user_role_column` not `update_schema`
5. **Add comments** - Explain WHY, not just WHAT
6. **Backup before pushing** - Especially important for production

## Migration Naming Convention

```
<timestamp>_<description>.sql

Examples:
20250101000000_initial_schema.sql
20250102120000_add_user_settings.sql
20250103093000_create_comments_table.sql
```

Timestamp format: `YYYYMMDDHHmmss`

## Need Help?

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
