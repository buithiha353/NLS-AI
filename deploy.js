import * as ftp from 'basic-ftp';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function deploy() {
  const host = process.env.DEPLOY_FTP_HOST;
  const user = process.env.DEPLOY_FTP_USER;
  const password = process.env.DEPLOY_FTP_PASSWORD;
  const secure = process.env.DEPLOY_FTP_SECURE !== 'false';
  const remoteDir = process.env.DEPLOY_FTP_REMOTE_DIR || '/nls-ai-app';
  const projectDir = process.cwd();
  const serverBundle = path.join(projectDir, 'app.cjs');
  const passengerEntry = path.join(projectDir, 'passenger-entry.js');
  const packageFile = path.join(projectDir, 'package.json');
  const clientBuild = path.join(projectDir, 'dist');
  const restartFile = path.join(os.tmpdir(), `nls-ai-restart-${Date.now()}.txt`);

  if (!host || !user || !password) {
    throw new Error('Missing DEPLOY_FTP_HOST, DEPLOY_FTP_USER, or DEPLOY_FTP_PASSWORD.');
  }

  await Promise.all([
    fs.access(serverBundle),
    fs.access(passengerEntry),
    fs.access(packageFile),
    fs.access(path.join(clientBuild, 'index.html')),
  ]);

  await fs.writeFile(restartFile, new Date().toISOString(), 'utf8');
  const client = new ftp.Client(60_000);

  try {
    await client.access({ host, user, password, secure });
    await client.ensureDir(remoteDir);
    await client.uploadFrom(serverBundle, `${remoteDir}/app.cjs`);
    await client.uploadFrom(passengerEntry, `${remoteDir}/app.js`);
    await client.uploadFrom(packageFile, `${remoteDir}/package.json`);
    await client.uploadFromDir(clientBuild, `${remoteDir}/dist`);
    await client.ensureDir(`${remoteDir}/tmp`);
    await client.uploadFrom(restartFile, `${remoteDir}/tmp/restart.txt`);
    console.log(`NLS-AI deployed to ${remoteDir}.`);
  } finally {
    client.close();
    await fs.rm(restartFile, { force: true });
  }
}

deploy().catch((error) => {
  console.error('NLS-AI deployment failed:', error);
  process.exitCode = 1;
});

