# Gabriele — One‑Page Portfolio (GitHub Pages)

A single‑page, terminal‑enhanced portfolio for Gabriele D'Asta. Built with plain HTML/CSS/JS, themed with Tokyo Night by default, and designed for GitHub Pages.

## Features
- Terminal widget with commands: `help`, `about`, `skills`, `projects`, `socials`, `stats`, `contact`, `theme <tokyo|light|matrix|dark>`, `open <section|url>`, `clear`.
- Animated hero (typewriter) and subtle background particles.
- Auto‑fetched GitHub projects (latest/top repos) via the public API.
- Sections: About, Skills, Projects, Stats, Contact.
- Accessible, responsive layout with theme switching.

## Local Preview
Use any static server. Two quick options from PowerShell:

```powershell
# Option 1: Python (if installed)
python -m http.server 5500 ; Start-Process http://localhost:5500

# Option 2: Node (no install, using npx)
npx serve . -l 5500 ; Start-Process http://localhost:5500
```

Or use VS Code's Live Server extension.

## Deploy to GitHub Pages
You have two simple paths:

- User/Org site (recommended if this is your profile site):
  1. Create a repo named `<your-username>.github.io`.
  2. Copy the contents of this folder to the repo root.
  3. Commit and push. Pages will go live at `https://<your-username>.github.io`.

- Project site (if you keep your main profile repo separate):
  1. Push this folder to a repo (e.g., `gabrieldev-site`).
  2. In repo Settings → Pages → Build and deployment: Source = `Deploy from a branch`, Branch = `main` (or the branch you used), Folder = `/root`.
  3. The site will be served at `https://<your-username>.github.io/<repo-name>/`.

No build step is required.

## Customize
- Update the hero text in `assets/js/main.js` (typewriter messages).
- Add/remove skills in `index.html` → Skills section.
- Tweak colors in `assets/css/style.css` (CSS variables for each theme).
- Change GitHub username in `assets/js/main.js` (`state.username`).

## Notes
- The Projects section fetches public repos via the GitHub API without auth; heavy rate limits may apply to many rapid refreshes.
- All third‑party stat images come from your existing README services and load client‑side.

## License
Personal use by Gabriele D'Asta. Feel free to reference structure and ideas for your own personal site.