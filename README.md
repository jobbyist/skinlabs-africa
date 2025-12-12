# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Bun installed - [install Bun](https://bun.sh/docs/installation)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
bun install

# Step 4: Start the development server with auto-reloading and an instant preview.
bun run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Bun 1.3.4
- Vite 7.2.7
- TypeScript
- React 19.2.1
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the `main` branch.

### GitHub Pages Deployment

The site is deployed to: **https://skinlabs.co.za**

#### Automatic Deployment

Every push to the `main` branch triggers the GitHub Actions workflow that:
1. Checks out the code
2. Sets up Bun 1.3.4
3. Installs dependencies
4. Builds the project
5. Deploys to GitHub Pages

#### Manual Deployment

You can also trigger a manual deployment from the GitHub Actions tab by running the "Deploy to GitHub Pages" workflow manually.

#### GitHub Pages Settings

To ensure the deployment works correctly, make sure GitHub Pages is configured in your repository settings:

1. Go to Settings > Pages
2. Under "Build and deployment", set Source to "GitHub Actions"
3. The custom domain `skinlabs.co.za` should be configured automatically via the CNAME file

#### DNS Configuration

For the custom domain to work, you need to configure DNS records:

- Add an A record pointing to GitHub Pages IPs:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153
- Or add a CNAME record pointing to: `jobbyist.github.io`

### Alternative: Lovable Deployment

You can also deploy via [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) by clicking Share -> Publish.
