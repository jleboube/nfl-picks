#!/bin/bash

echo "🔍 Detecting VM IP address..."

# Get the VM's IP address (this might vary depending on the VM setup)
VM_IP=$(hostname -I | awk '{print $1}')

# If that doesn't work, try other methods
if [ -z "$VM_IP" ]; then
    VM_IP=$(ip route get 8.8.8.8 | awk 'NR==1 {print $7}')
fi

if [ -z "$VM_IP" ]; then
    VM_IP=$(curl -s ifconfig.me 2>/dev/null || echo "192.168.69.111")
fi

echo "Detected IP: $VM_IP"

# Update the .env file with the detected IP
sed -i "s|API_URL=.*|API_URL=http://$VM_IP:5000|" .env

echo "✅ Updated .env file with IP: $VM_IP"
echo ""
echo "Contents of .env file:"
grep "API_URL" .env

echo ""
echo "Now run: ./restart.sh"