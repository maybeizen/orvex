# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report them privately through GitHub's
[security advisories](https://github.com/maybeizen/orvex/security/advisories/new).
Include a description of the issue, the affected component (frontend, API, agent,
a package, or the database), and reproduction steps if possible. We aim to
acknowledge reports promptly and will keep you updated on remediation.

## Supported versions

Orvex Monitor is under active development and does not yet publish tagged
releases. Security fixes target the `main` branch.

## Automated security tooling

This repository runs several automated checks:

- **CodeQL** static analysis for JavaScript/TypeScript and Go on every push and
  pull request to `main`, plus a weekly scheduled scan (`.github/workflows/codeql.yml`).
- **Dependabot** version updates for npm, Go modules, and GitHub Actions
  (`.github/dependabot.yml`).

## Handling secrets

- Never commit secrets. `.env` is git-ignored; copy from `.env.example`.
- The Supabase **service role key** and any SMTP or AWS credentials are
  server-only. Do not expose them to the browser bundle — only `VITE_`-prefixed
  values are shipped to the frontend.
