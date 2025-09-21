
# Serveur du jeu d'échange

Le serveur a été développer sans framework particulier, en utilisant les librairies [express](https://expressjs.com/) et [socket.io](https://socket.io/).


## Lancer le projet localement

Cloner le projet

```bash
  git clone https://github.com/bongibault-romain/trading-game-server/
```

Aller dans le dossier du projet

```bash
  cd trading-game-server
```

Installer les dépendences

```bash
  npm install
```

Créer un fichier `.env` pour les variables d'environement, vous pouvez copier directer le fichier `.env.example`

```
PORT=3333
```

Démarrer le serveur en mode dévelopment

```bash
  npm run dev
```

