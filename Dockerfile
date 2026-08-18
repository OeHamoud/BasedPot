FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# --------------------------------------------------
# System dependencies
# --------------------------------------------------
RUN apt-get update && \
    apt-get install -y \
      curl \
      ca-certificates \
      openssh-server \
      passwd \
      build-essential \
      postgresql \
      postgresql-contrib && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    echo 'root:root' | chpasswd && \
    mkdir -p /run/sshd && \
    rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# PostgreSQL configuration
# --------------------------------------------------
USER postgres

RUN service postgresql start && \
    psql -c "ALTER USER postgres PASSWORD 'postgres';"

USER root

# --------------------------------------------------
# React / Next.js application
# --------------------------------------------------
WORKDIR /Based-crm

COPY Based-crm/package*.json ./
RUN npm ci

COPY Based-crm/ ./

RUN npm run build

# --------------------------------------------------
# SSH
# --------------------------------------------------
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' \
      /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' \
      /etc/ssh/sshd_config

# --------------------------------------------------
# Startup script
# --------------------------------------------------
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 22 3000 5432

CMD ["/start.sh"]
