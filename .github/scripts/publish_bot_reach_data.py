#!/usr/bin/env python3
"""Publish only sanitized bot-stats.json to an independent orphan Git branch.

Never changes the website main branch. GITHUB_TOKEN credentials are provided by
GitHub Actions checkout; do not persist Discord credentials in data branch.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

REPO = 'Sepulchrebot/sepulchrebot.github.io'
BRANCH = 'bot-reach-data'
APPLICATION_ID = '1562563131580878969'


def git(root, *args, check=True):
    return subprocess.run(['git', '-C', str(root), *args], text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          check=check)


def main():
    root = Path(os.environ['GITHUB_WORKSPACE']).resolve()
    snapshot = root/'bot-stats.json'
    stats = json.loads(snapshot.read_text(encoding='utf-8'))
    if stats.get('schema') != 1 or str(stats.get('application_id')) != APPLICATION_ID:
        raise RuntimeError('STATS_SCHEMA_OR_BOT_ID_MISMATCH')
    if not isinstance(stats.get('servers'), int) or stats['servers'] < 1:
        raise RuntimeError('STATS_GUILDS_NOT_VERIFIED')
    if git(root, 'remote', 'get-url', 'origin').stdout.strip().split('github.com/')[-1].removesuffix('.git') != REPO:
        raise RuntimeError('UNEXPECTED_GITHUB_ORIGIN')
    exists = bool(git(root, 'ls-remote', '--heads', 'origin', f'refs/heads/{BRANCH}').stdout.strip())
    if exists:
        git(root, 'fetch', '--no-tags', 'origin', f'refs/heads/{BRANCH}:refs/remotes/origin/{BRANCH}')
    with tempfile.TemporaryDirectory(prefix='sepulchre-reach-') as temp:
        worktree = Path(temp)/'data'
        if exists:
            git(root, 'worktree', 'add', '--detach', str(worktree), f'origin/{BRANCH}')
            allowed = {'bot-stats.json', 'README.md'}
            names = set(git(worktree, 'ls-files').stdout.splitlines())
            if not names <= allowed:
                raise RuntimeError('DATA_BRANCH_HAS_UNEXPECTED_TRACKED_FILES')
        else:
            git(root, 'worktree', 'add', '--detach', str(worktree), 'HEAD')
            git(worktree, 'switch', '--orphan', BRANCH)
        try:
            shutil.copyfile(snapshot, worktree/'bot-stats.json')
            git(worktree, 'config', 'user.name', 'github-actions[bot]')
            git(worktree, 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
            git(worktree, 'add', '--', 'bot-stats.json')
            if not exists or git(worktree, 'diff', '--cached', '--quiet', check=False).returncode != 0:
                git(worktree, 'commit', '-m', 'chore: refresh Sepulchre verified bot reach')
                # Fast-forward only: never force push or mutate the website main branch.
                git(worktree, 'push', 'origin', f'HEAD:refs/heads/{BRANCH}')
                print('BOT_REACH_DATA_BRANCH_PUSH=PASS')
            else:
                print('BOT_REACH_DATA_BRANCH_ALREADY_CURRENT=TRUE')
            print('WEBSITE_MAIN_BRANCH_COMMITS=NONE')
        finally:
            git(root, 'worktree', 'remove', '--force', str(worktree), check=False)


if __name__ == '__main__':
    main()
