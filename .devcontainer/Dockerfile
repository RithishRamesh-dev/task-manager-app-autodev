# Use a smaller base image
FROM python:3.11-slim

# Install essential packages including sudo
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    curl \
    sudo \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Node.js using the official Node.js binary (ARM64 version for Apple Silicon)
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "arm64" ]; then \
        NODE_ARCH="arm64"; \
    else \
        NODE_ARCH="x64"; \
    fi && \
    curl -fsSL https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-${NODE_ARCH}.tar.xz \
    | tar -xJ -C /usr/local --strip-components=1 \
    && npm install -g @anthropic-ai/claude-code

# Create a non-root user for Claude Code (keeping the original design)
RUN useradd -m -s /bin/bash claude \
    && usermod -aG sudo claude \
    && echo "claude ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set working directory and change ownership
WORKDIR /workspace
RUN chown -R claude:claude /workspace

# Create entrypoint script to handle permissions
COPY .devcontainer/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Switch to non-root user
USER claude

# Set environment variables for the non-root user
ENV PATH="/home/claude/.local/bin:${PATH}"
ENV PYTHONPATH="/workspace"
