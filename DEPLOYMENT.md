# AWS Deployment (Docker Compose via SSH)

This project uses a GitHub Actions workflow to deploy to an Ubuntu EC2 instance via SSH and run Docker Compose.

## 1) AWS EC2 Setup (Ubuntu)
1. Launch an Ubuntu EC2 instance (e.g., t3.medium if running all services).
2. Open inbound ports in the Security Group:
   - 22 (SSH)
   - 8080 (API Gateway)
   - 3001 (User Service, optional if you want direct access)
   - 3002 (Event Service, optional)
   - 3003 (Ticket Service, optional)
   - 3004 (Payment Service, optional)
   - 3005 (Notification Service, optional)
   - 3006 (Reporting Service, optional)
3. SSH into the instance and install Docker + Compose:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
```

4. Clone your repo on the server (first time):

```bash
mkdir -p ~/apps
cd ~/apps

git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_NAME>
```

5. Create `.env` files on the server for each service you run:
   - `services/user-service/.env`
   - `services/event-service/.env`
   - `services/ticket-service/.env`
   - `services/payment-service/.env`
   - `services/notification-service/.env`
   - `services/reporting-service/.env`

## 2) GitHub Secrets
Add these secrets in GitHub Repo ? Settings ? Secrets and variables ? Actions:

- `AWS_HOST` = Public IP or DNS of EC2
- `AWS_USER` = ubuntu
- `AWS_SSH_KEY` = your **private SSH key** contents
- `AWS_SSH_PORT` = 22
- `AWS_APP_DIR` = absolute path to the repo on the server, e.g. `/home/ubuntu/apps/CTSE_Assignment1`

## 3) Pipeline File
Workflow file is located at:
- `.github/workflows/deploy.yml`

On every push to `main`, GitHub Actions will:
- SSH into the server
- `git reset --hard origin/main`
- `docker compose -f docker-compose.yml up -d --build`

## 4) First Manual Deploy (optional)
You can test once manually on the server:

```bash
cd /home/ubuntu/apps/CTSE_Assignment1

docker compose -f docker-compose.yml up -d --build
```

## 5) Verify
- API Gateway: `http://<EC2_PUBLIC_IP>:8080`
- Health check: `http://<EC2_PUBLIC_IP>:8080/api/health/user`

## Notes
- If you see permission errors running docker, ensure your user is in the `docker` group and re-login.
- Keep `.env` files out of git.
