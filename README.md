# MOD LIVING

Three separate folders:

| Folder    | What it is                                   | Dev URL                     |
|-----------|----------------------------------------------|-----------------------------|
| `client/` | Public website (React + Vite)                | http://localhost:5173       |
| `admin/`  | Admin panel (React + Vite) – login required  | http://localhost:5174/admin |
| `server/` | Node.js + Express API, uploads, JSON storage | http://localhost:5000       |

Everything on the website (texts, photos/videos, buttons, menu, footer, projects,
pages on/off, contact form labels, SEO) is stored by the server and edited from the admin panel.

## Run (development)

```
npm run install:all     # once
npm run dev             # starts server + client + admin together
```

Admin login (first run): **admin@modliving.com / Admin@123** – change it in Admin > Account.
Set your own in `server/.env` (copy `server/.env.example`) *before* the first run.

## Production (single server)

```
npm run build           # builds client/dist and admin/dist
npm start               # server serves site at /, admin at /admin, API at /api
```

## Database (MongoDB)

All saved data (website content, offer banner, leads, admin login, employees, attendance, salary)
is stored permanently in MongoDB, in the `documents` collection of your database.

Set the connection in `server/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/modliving                      # MongoDB installed on this PC
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/modliving   # MongoDB Atlas (free cloud)
```

On the first start the server copies any old `server/data/*.json` files into MongoDB, so nothing is lost.
If MongoDB cannot be reached the server stops with a clear message instead of losing changes.
`server/uploads/` (photos and videos) stays on disk - back it up.

## Admin panel

* Every admin address needs a login (`/admin/login`); after signing in you return to the page you wanted.
* **Contact & Map** - phone, email, address, factory, hours, WhatsApp and the Google Maps link of the showroom.
  Paste Google Maps *Share -> Copy link*; the website shows the map and tapping it opens Google Maps with directions.
* **Offer Banner** - festival / offer pop-up shown first on every open or refresh, with a close (X) button.
