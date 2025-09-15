#!/bin/bash

# Export the correct DATABASE_URL using the Replit PostgreSQL environment variables
export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST/$PGDATABASE"

# Set proper NODE_ENV for development
export NODE_ENV=development

# Start the development server
npm run dev