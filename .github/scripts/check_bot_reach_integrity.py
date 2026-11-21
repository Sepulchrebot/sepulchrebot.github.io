#!/usr/bin/env python3
"""Fail the website CI if the permanent counter integration is removed."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'index.html'
JS = ROOT / 'assets/sepulchre-live-reach.js'
CSS = ROOT / 'assets/sepulchre-live-reach.css'
WORKFLOW = ROOT / '.github/workflows/refresh-bot-reach.yml'
EXPORT = ROOT / '.github/scripts/export_bot_reach.py'
PUBLISH = ROOT / '.github/scripts/publish_bot_reach_data.py'


def check(root: Path = ROOT):
    index = (root/'index.html').read_text('utf-8')
    js = (root/'assets/sepulchre-live-reach.js').read_text('utf-8')
    workflow = (root/'.github/workflows/refresh-bot-reach.yml').read_text('utf-8')
    for name in ('assets/sepulchre-live-reach.css', '.github/scripts/export_bot_reach.py', '.github/scripts/publish_bot_reach_data.py'):
        if not (root/name).is_file():
            raise ValueError(f'COUNTER_REQUIRED_ASSET_MISSING:{name}')
    if len(re.findall(r'assets/sepulchre-live-reach\.js(?:\?[^"\']*)?', index)) != 1:
        raise ValueError('COUNTER_SCRIPT_REFERENCE_MISSING_OR_DUPLICATED')
    if len(re.findall(r'assets/sepulchre-live-reach\.css(?:\?[^"\']*)?', index)) != 1:
        raise ValueError('COUNTER_STYLE_REFERENCE_MISSING_OR_DUPLICATED')
    if not any(s in index for s in ('home:()=>', 'v9-hero-actions', 'hero-actions', 'data-sepulchre-reach-anchor')):
        raise ValueError('HERO_ACTIONS_UNRECOGNIZED_REVIEW_COUNTER_ANCHOR')
    if 'bot-reach-data/bot-stats.json' not in js or 'raw.githubusercontent.com/Sepulchrebot/' not in js:
        raise ValueError('COUNTER_INDEPENDENT_DATA_SOURCE_MISSING')
    if "sepulchre-hero-counter" not in js or 'MutationObserver' not in js:
        raise ValueError('COUNTER_SPA_MOUNT_MISSING')
    if 'bot-reach-data' not in workflow or 'publish_bot_reach_data.py' not in workflow:
        raise ValueError('SEPARATE_BRANCH_UPDATER_MISSING')
    if re.search(r'git\s+add\s+--?\s*bot-stats\.json|git\s+push\s*$', workflow, re.M):
        raise ValueError('UNSAFE_WEBSITE_MAIN_STATS_PUBLISHER')
    print('SEPULCHRE_COUNTER_STANDALONE_COMPONENT=PASS')
    print('SEPULCHRE_COUNTER_DATA_BRANCH=bot-reach-data')
    print('SEPULCHRE_COUNTER_WEBSITE_MAIN_STATS_COMMITS=NONE')
    print('SEPULCHRE_HERO_MOUNT_AND_SPA_REFRESH=PASS')


if __name__ == '__main__':
    try:
        check()
    except (ValueError, OSError) as exc:
        print('COUNTER_INTEGRITY_FAILED=' + str(exc), file=sys.stderr)
        raise SystemExit(1)
