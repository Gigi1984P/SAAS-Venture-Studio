# Ollama Server Warmup - Einrichtung

## Problem
Das erste Laden des Modells dauert 15-30 Sekunden. Danach geht es in 1-3 Sekunden.

## Lösung: Cron-Job auf dem VPS

### Schritt 1: Script auf VPS kopieren

```bash
# Auf deinem VPS ausführen:
cat > /opt/ollama-warmup.sh << 'EOF'
#!/bin/bash
curl -s -X POST http://localhost:32846/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1","prompt":"Hallo","stream":false}' \
  > /dev/null 2>&1
EOF

chmod +x /opt/ollama-warmup.sh
```

### Schritt 2: Cron-Job erstellen

```bash
# Crontab öffnen
crontab -e

# Diese Zeile hinzufügen (alle 5 Minuten):
*/5 * * * * /opt/ollama-warmup.sh

# Oder alle 2 Minuten für schnellere Antwort:
*/2 * * * * /opt/ollama-warmup.sh
```

### Schritt 3: Testen

```bash
# Manuell ausführen
/opt/ollama-warmup.sh

# Prüfen ob Cron läuft
sudo systemctl status cron

# Logs sehen
tail -f /var/log/syslog | grep CRON
```

## Alternative: Systemd Timer (besser)

```bash
# Service erstellen
sudo cat > /etc/systemd/system/ollama-warmup.service << 'EOF'
[Unit]
Description=Ollama Model Warmup

[Service]
Type=oneshot
ExecStart=/opt/ollama-warmup.sh
EOF

# Timer erstellen
sudo cat > /etc/systemd/system/ollama-warmup.timer << 'EOF'
[Unit]
Description=Ollama Warmup every 2 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
EOF

# Aktivieren
sudo systemctl daemon-reload
sudo systemctl enable ollama-warmup.timer
sudo systemctl start ollama-warmup.timer

# Status prüfen
sudo systemctl list-timers --all
```

## Test der App

Nach Einrichtung:
1. Geh zu https://saas-venture-studio.vercel.app/settings
2. Öffne "💡 Ideen-Scout"
3. Klicke "▶️ Agent testen"
4. Antwort kommt in 1-3 Sekunden!
