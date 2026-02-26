# RowdyCon CTFd Win95 Theme

## Run
- From repo root: `docker compose up -d --build`
- Open `http://localhost:8000`
- Defaults come from `.ctfd.env` (set strong values for `SECRET_KEY` and `DB_ROOT_PASSWORD` before non-local deployments)
- Stop with: `docker compose down`

The first account you register becomes the admin user (standard CTFd behavior). Use the web UI to create it.
The container entrypoint sets `ctf_theme` to `win95` on startup to ensure the theme is active before setup.

## What you get
- Windows 95 inspired desktop, taskbar, and Start menu
- Windowed pages with drag/resize and task switching
- Win95-styled challenges, scoreboard, teams, users, and profile views
- Local theme settings for sound, contrast, and reduced motion

## Extend
- Templates live in `theme/win95/templates`
- CSS overrides live in `theme/win95/static/css/win95.css`
- Window/taskbar logic lives in `theme/win95/static/js`

## Notes
- Admin views are untouched (default CTFd admin UI)
- No external CDNs; all assets are vendored
- Compose uses bind mounts under `.data/` for persistence
