# Publish this project to a new GitHub repository (Windows)

The cleaned project is prepared locally, but a new repository must first be created in your GitHub account.

## 1. Create the empty GitHub repository

1. Open https://github.com/new while signed in as `saibalaji123rgb`.
2. Repository name: `rocket-telemetry-digital-twin`
3. Description: `ESP32 and LoRa rocket telemetry with a React ground station and 3D digital twin dashboard.`
4. Choose **Private** for the first upload while you review the code and project evidence. You can change it to Public later.
5. Do not select the options to add a README, `.gitignore`, or license. This cleaned folder already contains its own README and `.gitignore`.
6. Click **Create repository**.

## 2. Upload the cleaned project using Git

1. Download `rocket-telemetry-digital-twin-clean.zip` and extract it.
2. Open the extracted `rocket-telemetry-digital-twin` folder in File Explorer.
3. Open PowerShell or Windows Terminal in that folder.
4. Run these commands one by one:

```powershell
git init
git branch -M main
git add .
git status
git commit -m "Initial commit: rocket telemetry digital twin"
git remote add origin https://github.com/saibalaji123rgb/rocket-telemetry-digital-twin.git
git push -u origin main
```

`git status` lets you review the staged files before the first commit. If Git asks you to sign in, complete the browser-based Git Credential Manager flow. Never paste a GitHub password or personal access token into this chat.

If Git reports that `origin` already exists, use:

```powershell
git remote set-url origin https://github.com/saibalaji123rgb/rocket-telemetry-digital-twin.git
```

If PowerShell says `git` is not recognized, install Git for Windows, reopen the terminal, and repeat the commands.

## 3. Verify

After the push completes, refresh the repository page and confirm that `README.md`, `firmware/`, `ground-station/`, and `docs/` are visible. Keep the repository Private until you have reviewed ownership, institutional disclosure rules, paper-submission restrictions, and any sensitive material in the screenshots.
