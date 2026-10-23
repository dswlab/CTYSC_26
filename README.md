# CTYSC 2026

## Project 03 — Sensor Maze

- Website: https://dswlab.github.io/CTYSC_26/project_03/
- Students: https://dswlab.github.io/CTYSC_26/project_03/student/
- Teachers: https://dswlab.github.io/CTYSC_26/project_03/teacher/

All published filenames are English. Page content is Korean.

## Deployment

Push `main` to trigger `.github/workflows/pages.yml`.
If Pages deployment is not enabled automatically, open **Settings → Pages → Build and deployment → Source: GitHub Actions**, then rerun the workflow.
The deployment artifact contains only `index.html` and `project_03/`, not build scripts.

## Teacher security

Teacher originals are **not** committed. `resources.enc.json` contains an AES-256-GCM encrypted bundle, with a key derived using PBKDF2-SHA-256 (600,000 iterations, random salt). A random IV is generated on every build. There is no hardcoded password or plaintext teacher bundle in the website.

This is an encrypted static resource vault, not a server-side account system. A strong password is essential because anyone can download the ciphertext for offline guessing. Anyone who knows the password can save and redistribute decrypted material. Revoking an already downloaded copy is not possible. Locking the browser does not delete downloaded files. Previously published encrypted bundles remain in Git history; changing the password does not revoke old copies.

Do not commit plaintext teacher files, the local password, or full mixed student/teacher ZIP archives. The public build script necessarily reveals the file structure and lesson topic, but not the password or private lesson contents. Students' Entry files include the simulator engine, not the completed decision rule.

## Rebuild resources locally

Requires Node.js 18+ and the private local `entry-drone-maze` source directory outside this repository:

```bash
npm ci
node scripts/build-project03.cjs ../entry-drone-maze
```

The build uses `markdown-it` to render the private teacher manual into a self-contained HTML document before encryption. No Markdown library or external CDN is required in the browser.

The initial password is randomly generated and stored **outside this repository** at `../.private/project03-password.txt`. The local password file is not part of the deployment. To rotate it, supply a strong `TEACHER_PASSWORD` environment variable or replace the local file, rebuild, and commit the newly encrypted bundle. If using the environment variable, maintain your own secure password record.

Serve the site over HTTPS or localhost (Web Crypto does not work on arbitrary insecure HTTP hosts):

```bash
python -m http.server 8000
```

Visit `http://localhost:8000/project_03/`.

## Verification

```bash
node scripts/test-project03.cjs
```

Resource validation includes local links, English paths, student archive contents, encrypted bundle integrity, wrong-password rejection, and round-trip decryption against local private originals. The private-source checks require the original source folder and local password. Entry GUI import/execution still needs to be checked in the classroom's Entry version.
