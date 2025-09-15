#!/bin/bash

# Export the correct DATABASE_URL using the Replit PostgreSQL environment variables
export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST/$PGDATABASE"

# Start the development server
npm run dev