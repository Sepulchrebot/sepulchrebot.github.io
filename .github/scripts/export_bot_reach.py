#!/usr/bin/env python3
"""Read-only Discord Gateway session to export safely aggregated bot reach.

No commands are registered or synced. Does not use guild member privileges.
Never writes credentials to disk and never prints the token.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import json
import os
from pathlib import Path

import discord

APPLICATION_ID = 1562563131580878969
OUT = Path(__file__).resolve().parents[2] / 'bot-stats.json'

class ReadOnlyReach(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents(guilds=True, members=False, messages=False, presences=False))
        self.summary = None

    async def on_ready(self):
        if self.summary is not None:
            return
        if self.user is None or self.user.id != APPLICATION_ID:
            raise RuntimeError('BOT_APPLICATION_ID_MISMATCH')
        if any(guild.unavailable for guild in self.guilds):
            raise RuntimeError('SOME_GUILDS_UNAVAILABLE; refusing incomplete count')
        counts = [guild.member_count for guild in self.guilds]
        # Member counts can be unavailable without enabling privileged intents.
        # Do not convert unknown member counts into misleading zeros.
        members_total = sum(counts) if all(isinstance(n, int) and n >= 0 for n in counts) else None
        self.summary = {
            'schema': 1,
            'application_id': str(APPLICATION_ID),
            'servers': len(self.guilds),
            'members_total': members_total,
            'updated_at': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
            'definition': 'members_total sums server member counts and may include duplicates across servers',
        }
        await self.close()

async def main():
    token = os.getenv('DISCORD_BOT_TOKEN', '').strip()
    if not token:
        raise RuntimeError('Missing GitHub Actions secret DISCORD_BOT_TOKEN')
    async with ReadOnlyReach() as bot:
        await asyncio.wait_for(bot.start(token, reconnect=False), timeout=70)
        if bot.summary is None:
            raise RuntimeError('Discord READY did not complete')
        if not bot.summary['servers']:
            raise RuntimeError('No guilds resolved; refusing to overwrite last known snapshot')
        OUT.write_text(json.dumps(bot.summary, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print('BOT_REACH_EXPORT=PASS')
        print('COMMUNITIES=' + str(bot.summary['servers']))
        print('MEMBER_COUNTS=' + ('AVAILABLE' if bot.summary['members_total'] is not None else 'UNAVAILABLE'))

if __name__ == '__main__':
    asyncio.run(main())
