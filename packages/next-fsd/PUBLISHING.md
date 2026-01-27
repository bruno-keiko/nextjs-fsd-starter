# Publishing `next-fsd` to npm

## Prerequisites

1. **Create an npm account** (if you don't have one):
   ```bash
   npm signup
   ```
   Or visit: https://www.npmjs.com/signup

2. **Enable Two-Factor Authentication (2FA)**:
   - Go to https://www.npmjs.com/settings/[your-username]/security
   - Enable 2FA (recommended: use an authenticator app)
   - OR create a granular access token with "publish" permissions:
     - Go to https://www.npmjs.com/settings/[your-username]/tokens
     - Click "Generate New Token"
     - Select "Granular Access Token"
     - Choose "Publish" scope
     - Copy the token (you'll only see it once!)

3. **Login to npm**:
   ```bash
   npm login
   ```
   
   If using a granular access token instead of 2FA:
   ```bash
   npm login --auth-type=legacy
   ```
   Then enter your username and the token as the password.

4. **Check if the package name is available**:
   ```bash
   npm view next-fsd
   ```
   If it returns 404, the name is available. If it shows package info, you'll need to choose a different name or use a scoped package (e.g., `@your-username/next-fsd`).

## Publishing Steps

**⚠️ IMPORTANT**: npm requires 2FA or a granular access token to publish packages. Make sure you've completed step 2 above before proceeding.

1. **Navigate to the package directory**:
   ```bash
   cd packages/next-fsd
   ```

2. **Verify package contents**:
   ```bash
   npm pack --dry-run
   ```
   This shows what files will be included in the published package.

3. **Update version** (if needed):
   Edit `package.json` and change the `version` field:
   - `1.0.0` for initial release
   - `1.0.1` for patch updates
   - `1.1.0` for minor updates
   - `2.0.0` for major updates

4. **Publish to npm**:
   ```bash
   npm publish
   ```
   
   For a scoped package (if name is taken):
   ```bash
   npm publish --access public
   ```

5. **Verify publication**:
   ```bash
   npm view next-fsd
   ```
   Or visit: https://www.npmjs.com/package/next-fsd

## Testing Before Publishing

Test locally using `npm link`:

1. **In the package directory**:
   ```bash
   cd packages/next-fsd
   npm link
   ```

2. **In another directory** (or globally):
   ```bash
   npm link next-fsd
   ```

3. **Test the command**:
   ```bash
   next-fsd test-app --template bruno-keiko/nextjs-fsd-starter
   ```

4. **Unlink when done**:
   ```bash
   npm unlink -g next-fsd
   ```

## Updating the Package

1. Make your changes
2. Update the version in `package.json`
3. Run `npm publish` again

## Important Notes

- The default template is set to `bruno-keiko/nextjs-fsd-starter` in the CLI code
- Make sure your GitHub repo is public so `degit` can clone it
- Test the CLI thoroughly before publishing
- Consider adding tests and CI/CD for automated publishing
