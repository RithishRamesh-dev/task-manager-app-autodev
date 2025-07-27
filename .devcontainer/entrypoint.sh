#!/bin/bash

# Create .claude directory if it doesn't exist and fix permissions
if [ ! -d "/home/claude/.claude" ]; then
    mkdir -p /home/claude/.claude
fi

# Fix ownership of the mounted .claude directory
chown -R claude:claude /home/claude/.claude 2>/dev/null || true

# Execute the original command
exec "$@"