FROM python:3.11

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create a non-root user for Claude Code
RUN useradd -m -s /bin/bash claude \
    && usermod -aG sudo claude

# Create entrypoint script to handle permissions
COPY .devcontainer/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /workspace