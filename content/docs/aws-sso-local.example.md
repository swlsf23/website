# Local AWS SSO notes (copy and fill in)

Copy this file to **`aws-sso.local`** in this directory (`content/docs/`, no `.md` extension). The repo’s **`.gitignore` already has `*.local`**, so that path is **not committed**.

---

## `aws configure sso` — answer at each prompt (one run)

Use **your** start URL and account id from Identity Center if they differ from the placeholders.

| Prompt | What to enter |
|--------|----------------|
| **SSO session name** | `portfolio` (any short label you like; groups this SSO in `~/.aws/config`) |
| **SSO start URL** | IPv4 portal URL from Settings, e.g. `https://d-906606c178.awsapps.com/start` |
| **SSO region** | `us-east-1` (same region where Identity Center is enabled) |
| **SSO registration scopes** | Press **Enter** only — keep default `sso:account:access`. **Do not** type the account id here. |
| *(browser opens — sign in as `portfolio-aws`, wait for success)* | |
| **Default client Region** | `us-east-1` (matches [`infra/terraform/variables.tf`](../../infra/terraform/variables.tf)) |
| **CLI default output format** | `json` |
| **Profile name** | `website-terraform` (or press Enter to accept `AdministratorAccess-<accountid>`) |

Then:

```bash
export AWS_PROFILE=website-terraform
aws sso login
aws sts get-caller-identity
```

If you pressed **Enter** at **Profile name** and accepted `AdministratorAccess-<accountid>`, use that name instead (this repo documents **`AdministratorAccess-136861976157`** in [`aws-auth-and-deploy.md`](aws-auth-and-deploy.md) and the root **`manage-site.sh`** script):

```bash
export AWS_PROFILE=AdministratorAccess-136861976157
aws sso login
```

---

| Field | Notes |
|-------|--------|
| **SSO start URL** | IAM Identity Center → **Settings** → **AWS access portal URLs** → **IPv4-only** (`https://d-….awsapps.com/start`). |
| **SSO region** | e.g. `us-east-1` — must match `aws configure sso`. |
| **AWS account ID** | 12-digit id from the access portal. |
| **CLI profile** | Name from `aws configure sso` (e.g. `website-terraform`). |
| **Identity Center user** | e.g. `portfolio-aws` (not IAM `sleslie23`). |
| **Permission set** | e.g. `AdministratorAccess` — shown in the portal. |

**Paste block:**

```
SSO_START_URL=
SSO_REGION=us-east-1
AWS_ACCOUNT_ID=
AWS_CLI_PROFILE=website-terraform
IDENTITY_CENTER_USER=portfolio-aws
PERMISSION_SET=AdministratorAccess
```

Your real SSO session is also in **`~/.aws/config`** after `aws configure sso`; this file is a short human-readable backup.

---

## Portal URLs (do not mix them up)

| Setting in Identity Center | Use for CLI? |
|----------------------------|----------------|
| **AWS access portal URLs** → **IPv4-only** (`https://d-….awsapps.com/start`) | **Yes** — this is the **SSO start URL** for `aws configure sso`. |
| **Issuer URL** (OIDC, `https://identitystore…` or similar) | **No** — not the CLI start URL. |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| **`Failed to retrieve an authorization code`** or OAuth fails after browser | Wrong **SSO registration scopes** (e.g. you pasted the **account id** instead of accepting the default) | Run `aws configure sso` again; at **SSO registration scopes** press **Enter** only so the value stays **`sso:account:access`**. |
| **`Unable to parse config file`** in `~/.aws/config` | Typo or bad line in `[profile …]` / `sso_session` | Edit `~/.aws/config` or remove the broken profile block and re-run `aws configure sso`. |
| **`The SSO session … has expired` / `Token has expired`** | Normal SSO TTL | `aws sso login --profile <profile>` (or `export AWS_PROFILE=…` then `aws sso login`). |
| Console works but CLI says **access denied** | User not assigned to this account + permission set | Identity Center → **AWS accounts** → your account → assign your user + permission set (e.g. `AdministratorAccess`). |

---

## Identity Center checklist (admin)

1. **Enable** IAM Identity Center (pick **Identity Center region**, e.g. `us-east-1`).
2. **Permission sets** — e.g. `PortfolioInfrastructure` with `AdministratorAccess` (or a tighter custom policy later).
3. **Users** — add user (e.g. `portfolio-aws`), complete invite.
4. **AWS accounts** → select account → **Assign users or groups** → assign that user + permission set.
5. Copy **SSO start URL** from **Settings** (IPv4) for `aws configure sso`.
