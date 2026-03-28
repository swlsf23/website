# AWS auth, SSO, and deploy (reference)

This document records how this repo is meant to be used with AWS: **who logs in how**, **what runs on your machine**, and **how to ship the static site**. It complements [`infra/README.md`](../../infra/README.md).

**Prompt-by-prompt answers for `aws configure sso`** (session name, start URL, region, **scopes — press Enter**, profile name, then `aws sso login`) are in **[`aws-sso-local.example.md`](aws-sso-local.example.md)**. Copy that file to **`aws-sso.local`** in the same directory (ignored via `*.local` in `.gitignore`) for your own values and notes.

---

## What runs where

| Tool | Role |
|------|------|
| **Terraform** (`infra/terraform`) | Creates **S3** + **CloudFront** (and related IAM/OAC). Uses the AWS API via the Terraform AWS provider. **Does not** invoke the `aws` CLI binary. |
| **AWS CLI** (`aws`) | **SSO** / credentials (`aws configure sso`, `aws sso login`) and **deploy** (`aws s3 sync`, `aws cloudfront create-invalidation`) via **[`manage-site.sh`](../../manage-site.sh)**. |
| **`manage-site.sh`** | Repo-root wrapper: **`infra-create`** / **`infra-destroy`** / **`infra-import-bucket`** (Terraform), **`site-build`** (npm + PDFs + Vite), **`site-deploy`** (sync `dist/` + invalidate CloudFront). |

Everything needs **valid AWS credentials** in the environment (files or env vars). Terraform and the AWS CLI share the **same credential chain** (including `AWS_PROFILE`).

Default Terraform **region** is **`us-east-1`** (see `infra/terraform/variables.tf`). Match your CLI default / SSO profile region unless you change the variable.

---

## Root user vs IAM user vs IAM Identity Center

| Identity | What it is |
|----------|------------|
| **Root** | The account owner login (email + password + optional MFA/passkey). Full account control (billing, close account, some tasks only root can do). Use sparingly. |
| **IAM user** (e.g. `sleslie23`) | An identity **inside** IAM. Permissions = attached policies. Console sign-in: **Account ID (12 digits) or alias** + **IAM username** + **password** on the **IAM user** sign-in URL—not the root email field. |
| **IAM Identity Center (SSO)** | Separate **directory** of users; sign-in at the SSO **start URL** (`…awsapps.com/start`). Access to the account is via **roles** created by permission sets—not the same database row as a classic IAM user. |

**`sleslie23` is not “the same user” as an Identity Center user.** You can keep both, or rely on SSO for day-to-day work and reduce IAM users later.

---

## Recommended path: IAM Identity Center + CLI profile

Long-lived IAM access keys work but are discouraged. Prefer **SSO**:

1. In the console (as root or admin): **IAM Identity Center** → **Enable** (choose an **Identity Center region**, e.g. `us-east-1`).
2. **Permission sets** → e.g. `PortfolioInfrastructure` with `AdministratorAccess` (tighten later).
3. **Users** → add yourself (real email), complete invitation / password.
4. **AWS accounts** → assign your user + permission set to **this** account.
5. From Identity Center **Settings**, copy **SSO start URL** (use the **IPv4** portal URL, not the Issuer URL) and note **Identity Center region**.

On your Mac (AWS CLI v2 installed), run `aws configure sso` and follow **[`aws-sso-local.example.md`](aws-sso-local.example.md)** line by line (especially **SSO registration scopes**: press Enter only). Create a profile name you will reuse (e.g. `website-terraform`). Then:

```bash
aws sso login --profile website-terraform
aws sts get-caller-identity --profile website-terraform
export AWS_PROFILE=website-terraform
```

Use the same `AWS_PROFILE` for Terraform and for **`./manage-site.sh site-deploy`**. When the SSO session expires, run `aws sso login` again.

### Common profile for this workspace

If you pressed Enter at the **`aws configure sso`** profile prompt, the CLI often created a profile named `AdministratorAccess-<account-id>`. For account `136861976157` that is:

```bash
export AWS_PROFILE=AdministratorAccess-136861976157
aws sso login
```

Use that in any terminal where you run **`terraform`** in `infra/terraform` or **`./manage-site.sh`**. Substitute your profile name if you chose something else (e.g. `website-terraform`).

**Cost:** IAM Identity Center is **no additional charge** for standard workforce use; you still pay for **resources** (S3, CloudFront, transfer, etc.).

---

## IAM console sign-in (classic IAM user)

If you use an IAM user for the **console**:

- **Account ID or alias** = **12-digit account ID** (or account alias), **not** the IAM username.
- **IAM username** = e.g. `sleslie23`.
- **Password** = that IAM user’s console password.

Your account-specific URL looks like `https://<account-id>.signin.aws.amazon.com/console`.

---

## Terraform: apply and tear down

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit bucket name, etc.
terraform init
terraform plan
terraform apply
```

**Destroy:** **`./manage-site.sh infra-destroy`** asks you to type **`yes`**, then runs **`terraform destroy`** in `infra/terraform` (Terraform prompts again before applying). The SPA bucket has **`force_destroy = true`** and **`versioning` suspended** so Terraform can remove objects and the bucket.

After recreate, **outputs change** (e.g. CloudFront distribution ID). `site-deploy` reads **`terraform output`** if `SPA_S3_BUCKET` / `CLOUDFRONT_DISTRIBUTION_ID` are unset.

---

## Deploy the site bundle

From repo root (after `export AWS_PROFILE=...` and `aws sso login` if using SSO):

```bash
./manage-site.sh site-build
./manage-site.sh site-deploy
```

---

## Security notes (short)

- **Passkeys** are strong for **browser** sign-in; CLI/Terraform still use **API credentials** (SSO session or keys).
- **Root:** enable MFA/passkey and billing alerts as appropriate for your risk tolerance.
- **Backup access:** second passkey or hardware key, or documented recovery for root email.

---

## Optional cleanup

- IAM user **`website-terraform`**: only needed if you use **access keys** on that user. If you standardize on SSO, delete unused access keys and optionally the user.
- Do not commit **access keys** or **terraform.tfvars** with secrets; keep `terraform.tfvars` gitignored as in [`infra/README.md`](../../infra/README.md).
