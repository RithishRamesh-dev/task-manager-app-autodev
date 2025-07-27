#!/bin/bash
set -euo pipefail # Exit on error, undefined vars, and pipeline failures
IFS=$'\n\t' # Stricter word splitting

# Flush existing rules and delete existing ipsets
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X
ipset destroy allowed-domains 2>/dev/null || true

# First allow DNS and localhost before any restrictions
# Allow outbound DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
# Allow inbound DNS responses
iptables -A INPUT -p udp --sport 53 -j ACCEPT
# Allow outbound SSH
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
# Allow inbound SSH responses
iptables -A INPUT -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
# Allow localhost
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Create ipset with CIDR support
ipset create allowed-domains hash:net

# Fetch GitHub meta information and aggregate + add their IP ranges
echo "Fetching GitHub IP ranges..."
gh_ranges=$(curl -s https://api.github.com/meta)
echo "$gh_ranges" | jq -r '.git[]' | aggregate | while read -r range; do
    ipset add allowed-domains "$range"
done
echo "$gh_ranges" | jq -r '.web[]' | aggregate | while read -r range; do
    ipset add allowed-domains "$range"
done
echo "$gh_ranges" | jq -r '.api[]' | aggregate | while read -r range; do
    ipset add allowed-domains "$range"
done

# Add specific Claude-related domains
allowed_domains=(
    "anthropic.com"
    "claude.ai"
    "docs.anthropic.com"
    "api.anthropic.com"
    "cdn.anthropic.com"
    "pypi.org"
    "files.pythonhosted.org"
    "registry.npmjs.org"
    "nodejs.org"
    "raw.githubusercontent.com"
    "github.com"
    "api.github.com"
    "objects.githubusercontent.com"
)

for domain in "${allowed_domains[@]}"; do
    echo "Resolving $domain..."
    ips=$(dig +short "$domain" | grep -E '^[0-9]+\.' || true)
    for ip in $ips; do
        ipset add allowed-domains "$ip" 2>/dev/null || true
    done
done

# Allow traffic to allowed domains
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
iptables -A INPUT -m set --match-set allowed-domains src -m state --state ESTABLISHED -j ACCEPT

# Allow local network traffic (for development services)
iptables -A OUTPUT -d 127.0.0.0/8 -j ACCEPT
iptables -A INPUT -s 127.0.0.0/8 -j ACCEPT
iptables -A OUTPUT -d 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -s 10.0.0.0/8 -j ACCEPT
iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT
iptables -A INPUT -s 172.16.0.0/12 -j ACCEPT
iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
iptables -A INPUT -s 192.168.0.0/16 -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED -j ACCEPT

# Default deny policy
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -P FORWARD DROP

echo "Firewall rules applied successfully"