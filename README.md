# RowdyCon Win95 Theme (CTFd)

Windows 95 styled user-facing theme for CTFd with draggable windows, taskbar UI, challenge explorer filters, and category icons.

## Requirements
- Docker + Docker Compose

## Run
1. `cd /home/caldera/Downloads/sekai/RowdyCon`
2. `docker compose up -d --build`
3. Open `http://localhost:8000`

Stop:
- `docker compose down`

Smoke test:
- `curl -fsS http://localhost:8000 | grep -q 'data-theme="win95"' && echo "theme active"`

## Notes
- Admin pages remain default CTFd UI.
- Theme is set to `win95` at container startup by `ctfd/entrypoint-win95.sh`.
- Data is persisted with bind mounts under `.data/`.

## Challenge Category Icons
The challenge explorer shows an icon for `All` plus one icon per category.

### Default behavior
If no custom mapping is set, icons are chosen by category keyword (for example: `web`, `pwn`, `crypto`, `forensics`).

### Custom icon mapping
You can override category icons using CTFd theme settings JSON.

1. Open the CTFd admin panel.
2. Go to config/theme settings JSON.
3. Add `win95_category_icons` with a map of `category -> icon path`.

Example:
```json
{
  "win95_category_icons": {
    "Windows": "/themes/win95/static/img/icons/computer.svg",
    "Linux": "/themes/win95/static/img/icons/terminal.svg",
    "Web": "/themes/win95/static/img/icons/globe.svg"
  }
}
```

### Allowed icon paths
For safety and offline operation, icons must be local paths only:
- `/themes/win95/static/img/icons/...`
- `/files/...` (if uploaded into CTFd and exposed locally)

Not allowed:
- `http://...`, `https://...`, `//...`, `data:...`, `javascript:...`

After saving theme settings, refresh the Challenges page.

## Project Layout
- `theme/win95/templates` - Jinja templates
- `theme/win95/static/css` - Win95 styles
- `theme/win95/static/js` - interactions (windows, taskbar, challenge tracker)
- `docker-compose.yml` - local CTFd stack
