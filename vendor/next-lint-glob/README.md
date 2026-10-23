# Next.js lint glob adapter

This private adapter replaces the fast-glob dependency used by the Next.js lint plugin. Its dependency chain otherwise includes braces, which is affected by GHSA-vfj7-8cjw-p6xm without a patched upstream release.

The adapter preserves the globSync API used for Next.js lint root discovery, including literal directories and relative/absolute path conventions. It rejects patterns longer than 1024 characters. It uses the already present tinyglobby library (MIT, https://github.com/SuperchupuDev/tinyglobby) and does not affect application request handling. The adapter is adapted from the owner's existing Project Cognition implementation.

Run `node --test vendor/next-lint-glob/index.test.mjs` to verify the supported interface and input bound.
