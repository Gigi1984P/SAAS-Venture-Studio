# SAAS Venture Studio

## SSH-Key für GitHub

**Public Key** (bei GitHub eintragen):
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMKUt82571m199Q8CoQbVWDwlaTmokfepitPVQ7ILAW3 saas-venture-studio@20260906
```

**Private Key** liegt unter `.ssh/saas-venture-studio` — **NICHT committen!**

### SSH-Konfiguration (Host-spezifisch)
In `~/.ssh/config` hinzufügen:
```
Host github-saas-venture-studio
    HostName github.com
    User git
    IdentityFile ~/.ssh/saas-venture-studio
    IdentitiesOnly yes
```

Dann im Repo:
```bash
git remote add origin git@github-saas-venture-studio:DEIN_USER/saas-venture-studio.git
```

## Projekt-Initialisierung

Siehe `PROJECT-STATE.md` für den vollständigen Tech-Stack.

### Scripts
```bash
# Dev-Server starten
npm run dev

# Tests
npm run test
npm run test:watch

# Datenbank
npm run db:generate
npm run db:push
```

## Umgebungsvariablen
1. `.env.example` kopieren nach `.env.local`
2. Werte eintragen (siehe 1Password)

## DSGVO/GDPR
Siehe Checkliste in `PROJECT-STATE.md`.
