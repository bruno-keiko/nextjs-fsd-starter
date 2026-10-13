# Releasing `next-fsd`

The npm package and its default template use the same version. `next-fsd@1.1.0` downloads the reviewed `next-fsd-v1.1.0` Git tag rather than `main`.

1. Update the package version and lockfile with `npm version <version> --no-git-tag-version --prefix packages/next-fsd`.
2. Run root validation, `npm test --prefix packages/next-fsd`, and `npm run test:generated --prefix packages/next-fsd`.
3. Commit and push the change. Wait for GitHub CI to pass.
4. Create the matching template tag on that tested commit and push it:

   ```bash
   git tag next-fsd-v1.1.0 <tested-commit>
   git push origin next-fsd-v1.1.0
   ```

5. Inspect the npm archive with `npm pack --dry-run --prefix packages/next-fsd`. It must include the CLI helpers and package metadata.
6. Test the packed package against the pushed template tag in a temporary directory. Verify both database choices and `--minimal`.
7. Sign in to an npm account authorized to publish `next-fsd`, then publish:

   ```bash
   npm login
   npm whoami
   cd packages/next-fsd
   npm publish --access public
   ```

8. Confirm the registry version with `npm view next-fsd version` and run `npx next-fsd@<version> <new-project>`.

Use the actual release version in the commands above. Never move an existing template tag; make a new release for changes. `--ref main` is available for testing unpublished template changes, and custom templates default to `main` unless a ref is supplied.

The repository's semantic-release workflow creates GitHub releases. It does not publish this npm package.
