#!/bin/bash
UID_EMAIL=$1
curl -s --url "imaps://imap.ionos.com" \
  --user "$IONOS_USER:$IONOS_PASS" \
  --request "UID MOVE $UID_EMAIL Prospects outbound"
