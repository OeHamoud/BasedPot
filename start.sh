#!/bin/bash

set -e

echo "Starting PostgreSQL..."
service postgresql start

echo "Starting SSH..."
service ssh start

echo "Starting Next.js..."
cd /Based-crm
npm start
