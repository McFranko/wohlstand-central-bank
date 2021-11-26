#!/bin/sh

mkdir backups

DAY_OF_WEEK=$(date +"%w")

mkdir "backups/${DAY_OF_WEEK}"

tar -cvf "backups/${DAY_OF_WEEK}/$(date) accounts.tar.gz" accounts
