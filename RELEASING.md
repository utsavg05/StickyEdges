# Releasing Sticky Edges

## One-time GitHub setup

1. Push this project to its public GitHub repository.
2. Add the repository URL to `package.json`, for example:

   ```json
   "repository": { "type": "git", "url": "https://github.com/OWNER/sticky-edges.git" }
   ```

   Electron Builder records this address in each installer so installed apps know which GitHub Releases feed to poll.
3. Ensure GitHub Actions has **Read and write permissions** in the repository’s Actions settings.

## Create a release

1. Increment `version` in `package.json`.
2. Commit and push the change.
3. Create and push a matching version tag:

   ```powershell
   git tag v0.1.0
   git push origin v0.1.0
   ```

GitHub Actions builds the Windows NSIS installer and an unsigned universal macOS DMG, then uploads both to the same GitHub Release. Installed Windows apps check GitHub Releases at startup, download a newer release automatically, and install it when the user exits the app. macOS updates are manual for now: users download the newest DMG and replace the app in Applications.

## Local installer

Run `npm run dist`. The installer appears in `release/` and does not publish anything.

## Local macOS DMG

On a Mac, run:

```bash
npm run dist:mac
```

The command generates a universal unsigned DMG in `release/`. It must run on macOS because it uses the system `sips` and `iconutil` tools to create the `.icns` application icon.
