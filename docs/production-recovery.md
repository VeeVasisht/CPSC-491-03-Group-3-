# Production Rollback and Recovery Procedure

**Project:** WeTravel  
**Jira Story:** SCRUM-143  
**Platform:** Firebase Hosting (production)  
**Deployment:** GitHub Actions

## 1. Purpose

This runbook describes how to recover WeTravel when a new Firebase Hosting deployment causes the application to fail or behave incorrectly. Recovery is performed manually using Firebase Hosting release history and verified using the existing production smoke tests.

## 2. When to Use This Procedure

Start a recovery investigation if:

- The post-deployment smoke tests fail.
- The production home page or public routes are unavailable.
- A deployment introduces a critical user-facing issue.

A failed GitHub Actions job does **not** necessarily mean a broken version was deployed. Check whether the deployment itself succeeded and determine which version is currently live before rolling back.

## 3. Prerequisites

- Access to the WeTravel Firebase project with permission to manage Hosting releases.
- Access to the GitHub Actions deployment and smoke-test logs.
- A **known-good** previous Firebase Hosting release, confirmed by earlier testing or usage.
- The production site URL and the command/configuration for running smoke tests against it.
- Team coordination before changing the live production release.

**Important:** Carry out intentional failure simulations on a separate Firebase Hosting **test site's live channel**, not on the production site. Firebase Hosting's built-in rollback feature applies to a site's live channel; preview channels do not support the same rollback action.

## 4. Identify the Failed Deployment

1. Open the GitHub repository and navigate to **Actions**.
2. Review the latest production deployment workflow and post-deployment smoke-test results.
3. Record the failed workflow run, commit, time, affected URL, and observed symptoms.
4. Open the [Firebase Console](https://console.firebase.google.com/) and navigate to **Hosting & Serverless > Hosting**.
5. In **Release history**, record the active release identifier and identify an earlier known-good release.
6. Confirm that reverting the hosted application is appropriate. Do not assume the most recent older release is healthy without checking.

## 5. Roll Back Firebase Hosting

1. In the Firebase Console, open **Hosting & Serverless > Hosting** for the correct project and site.
2. Locate the desired known-good release in **Release history**.
3. Open that release's **three-dot menu** and select **Roll back**.
4. Confirm the operation, following the console prompts.
5. Refresh **Release history** and confirm the new active release points to the intended previous version.
6. Record the rollback time and release identifier.

Firebase Hosting rollback creates a new release serving the content and Hosting configuration from the selected historical version. It does not require rebuilding from GitHub.

## 6. Verify Recovery

1. Open the production site in a browser and check that the home page loads.
2. Verify the public routes and any key user flows affected by the incident.
3. Rerun the existing Vitest production smoke tests against the **restored production URL**, using the same test configuration as the GitHub Actions verification job. For example, if running locally:

   ```bash
   npx vitest run tests/smoke/production.test.ts
   ```

   Make sure the test's configured base URL points at the environment being verified before running it.

4. Confirm that all required smoke tests pass and that the deployed site behaves as expected.
5. Record the results and notify the team that service has been restored.

**Success criteria:** The intended earlier release is active, the application is accessible, and production smoke tests pass.

## 7. If Recovery Fails

- **Rollback option unavailable:** Check project/site selection, account permissions, and whether the desired version is still retained in Hosting release history.
- **Rollback completes but tests fail:** Review Hosting logs, browser errors, current configuration, and whether the older app version is compatible with existing backend data and rules. Consider another *verified* healthy release.
- **No usable previous release:** Coordinate a corrective build and redeployment from a known-good Git commit using the established CI/CD process.
- **Backend or security-rule issue:** Escalate to the team for a separate recovery procedure. A Hosting rollback does **not** restore Firestore documents, authentication data, or independently deployed Firestore security rules.

If recovery cannot be verified, do not declare the incident resolved.

## 8. Evidence and Documentation

For each recovery exercise or incident, record:

| Item | Result |
| --- | --- |
| Date and environment | [Enter date / production or test site] |
| Incident or test scenario | [Describe failure] |
| Failed workflow / release | [Link or release identifier] |
| Known-good release | [Release identifier] |
| Rollback start and end | [Times] |
| Smoke-test result | [Pass/fail and log link] |
| Final status | [Recovered / unresolved] |

Save supporting screenshots of the release history, rollback action, active restored release, and smoke-test results. Link this evidence in Jira **SCRUM-143** or the recovery test report.

## 9. After Recovery

- Notify teammates of the incident, restored release, and verification result.
- Investigate and fix the underlying problem on a development branch.
- **Do not immediately redeploy the latest `main` commit** if it still contains the faulty change. A manual Firebase rollback does not revert Git history.
- Resume normal production deployments only after the fix is reviewed and verified.

## Reference

- [Firebase Hosting: Manage live and preview channels, releases, and versions](https://firebase.google.com/docs/hosting/manage-hosting-resources)
