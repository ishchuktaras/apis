#!/bin/bash
# ==============================================================
# APIS SaaS - Wedos VPS ON Initial Setup Script
# Ubuntu 24.04 LTS Server Configuration
# 
# Run as root: sudo bash vps-setup.sh
# ==============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  APIS SaaS - Wedos VPS ON Setup Script         ${NC}"
echo -e "${BLUE}  Ubuntu 24.04 LTS Server Configuration         ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo bash vps-setup.sh)${NC}"
    exit 1
fi

# ==============================================================
# STEP 1: System Update
# ==============================================================
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"

apt-get update
apt-get upgrade -y
apt-get dist-upgrade -y
apt-get autoremove -y

echo -e "${GREEN}✓ System updated${NC}"

# ==============================================================
# STEP 2: Set Hostname
# ==============================================================
echo -e "${YELLOW}Step 2: Setting hostname...${NC}"

hostnamectl set-hostname vps-apis-production
echo "127.0.0.1 vps-apis-production" >> /etc/hosts

echo -e "${GREEN}✓ Hostname set to: vps-apis-production${NC}"

# ==============================================================
# STEP 3: Create Deploy User
# ==============================================================
echo -e "${YELLOW}Step 3: Creating deploy user...${NC}"

if ! id "deployer" &>/dev/null; then
    adduser --disabled-password --gecos "" deployer
    usermod -aG sudo deployer
    echo "deployer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deployer
    chmod 440 /etc/sudoers.d/deployer
    echo -e "${GREEN}✓ User 'deployer' created${NC}"
else
    echo -e "${YELLOW}User 'deployer' already exists${NC}"
fi

# ==============================================================
# STEP 4: SSH Hardening
# ==============================================================
echo -e "${YELLOW}Step 4: Configuring SSH security...${NC}"

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configure SSH
cat > /etc/ssh/sshd_config.d/hardening.conf << EOF
# APIS SaaS SSH Hardening
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# Restart SSH
systemctl restart ssh

echo -e "${GREEN}✓ SSH hardened${NC}"
echo -e "${YELLOW}  IMPORTANT: Make sure you have SSH key access before logging out!${NC}"

# ==============================================================
# STEP 5: Install Required Packages
# ==============================================================
echo -e "${YELLOW}Step 5: Installing required packages...${NC}"

apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    iotop \
    ncdu \
    unzip \
    cifs-utils \
    ufw \
    fail2ban \
    logrotate \
    ca-certificates \
    gnupg \
    lsb-release

echo -e "${GREEN}✓ Packages installed${NC}"

# ==============================================================
# STEP 6: Configure Firewall (UFW)
# ==============================================================
echo -e "${YELLOW}Step 6: Configuring firewall...${NC}"

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 8000/tcp comment 'Coolify Dashboard'
ufw allow 6001/tcp comment 'Coolify Webhooks'

# Enable UFW
echo "y" | ufw enable

echo -e "${GREEN}✓ Firewall configured${NC}"

# ==============================================================
# STEP 7: Install ufw-docker (fixes Docker/UFW issue)
# ==============================================================
echo -e "${YELLOW}Step 7: Installing ufw-docker...${NC}"

wget -O /usr/local/bin/ufw-docker \
    https://github.com/chaifeng/ufw-docker/raw/master/ufw-docker
chmod +x /usr/local/bin/ufw-docker

echo -e "${GREEN}✓ ufw-docker installed${NC}"

# ==============================================================
# STEP 8: Configure Fail2ban
# ==============================================================
echo -e "${YELLOW}Step 8: Configuring Fail2ban...${NC}"

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}✓ Fail2ban configured${NC}"

# ==============================================================
# STEP 9: Prepare Wedos Disk Mount Point
# ==============================================================
echo -e "${YELLOW}Step 9: Preparing Wedos Disk mount point...${NC}"

mkdir -p /mnt/wedos-disk
mkdir -p /root/.credentials

cat > /root/.credentials/wedos-template << EOF
# Wedos Disk Credentials Template
# Fill in your actual credentials and rename to 'wedos'
username=wXXXXX
password=YOUR_PASSWORD_HERE
domain=WEDOS
EOF

chmod 600 /root/.credentials/wedos-template

echo -e "${GREEN}✓ Mount point created${NC}"
echo -e "${YELLOW}  Edit /root/.credentials/wedos-template with your Wedos credentials${NC}"
echo -e "${YELLOW}  Then rename it to /root/.credentials/wedos${NC}"

# ==============================================================
# STEP 10: Create backup directories
# ==============================================================
echo -e "${YELLOW}Step 10: Creating backup directories...${NC}"

mkdir -p /var/log/apis
touch /var/log/apis-backup.log
touch /var/log/apis-restore.log

echo -e "${GREEN}✓ Directories created${NC}"

# ==============================================================
# STEP 11: Install Coolify
# ==============================================================
echo -e "${YELLOW}Step 11: Installing Coolify...${NC}"
echo -e "${YELLOW}  This will install Docker and Coolify...${NC}"

curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo -e "${GREEN}✓ Coolify installed${NC}"

# ==============================================================
# STEP 12: Configure ufw-docker after Docker installation
# ==============================================================
echo -e "${YELLOW}Step 12: Configuring ufw-docker...${NC}"

/usr/local/bin/ufw-docker install
systemctl restart ufw

echo -e "${GREEN}✓ ufw-docker configured${NC}"

# ==============================================================
# STEP 13: Setup cron job for backups
# ==============================================================
echo -e "${YELLOW}Step 13: Setting up backup cron job...${NC}"

# Add backup cron job (runs at 2 AM daily)
(crontab -l 2>/dev/null || echo "") | grep -v "backup.sh" | { cat; echo "0 2 * * * /opt/apis/scripts/backup.sh >> /var/log/apis-backup.log 2>&1"; } | crontab -

echo -e "${GREEN}✓ Backup cron job configured${NC}"

# ==============================================================
# FINAL SUMMARY
# ==============================================================
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  VPS Setup Completed Successfully!             ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next Steps:"
echo ""
echo "1. Configure Wedos Disk credentials:"
echo "   - Edit /root/.credentials/wedos-template"
echo "   - Add your Wedos Disk credentials"
echo "   - Rename to /root/.credentials/wedos"
echo ""
echo "2. Add fstab entry for Wedos Disk:"
echo "   //<server>/<username> /mnt/wedos-disk cifs credentials=/root/.credentials/wedos,iocharset=utf8,file_mode=0777,dir_mode=0777,noperm,_netdev 0 0"
echo ""
echo "3. Mount Wedos Disk:"
echo "   mount -a"
echo ""
echo "4. Access Coolify dashboard:"
echo "   http://$(hostname -I | awk '{print $1}'):8000"
echo "   - Create admin account immediately!"
echo ""
echo "5. Configure DNS for your domain:"
echo "   - A record: @ -> $(hostname -I | awk '{print $1}')"
echo "   - A record: * -> $(hostname -I | awk '{print $1}')"
echo ""
echo "6. SSH Access:"
echo "   - Add your SSH public key to /home/deployer/.ssh/authorized_keys"
echo ""
echo -e "${YELLOW}IMPORTANT: Test SSH key access before logging out!${NC}"
echo ""
