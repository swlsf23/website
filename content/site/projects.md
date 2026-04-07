---
slug: projects
title: Projects
---

These are projects I built and maintain, with links to live sites and source code.

## Personal website

This is a personal project where I built and maintain this site, including infrastructure, CI/CD, web app, and PDF generation.

| Layer | Details |
| --- | --- |
| Infrastructure | Infrastructure is defined and deployed with [Terraform](https://www.terraform.io/). The static site is served from [Amazon S3](https://aws.amazon.com/s3/) behind [Amazon CloudFront](https://aws.amazon.com/cloudfront/). |
| CI/CD | [GitHub Actions](https://github.com/features/actions) build and deploy the site on every push to `main`. |
| Webapp | The UI is a single-page [React](https://react.dev/) app built with [Vite](https://vitejs.dev/) and [TypeScript](https://www.typescriptlang.org/). |
| PDF generation | Resume and writing samples are rendered to PDF with [marked](https://marked.js.org/) (Markdown to HTML), [Playwright](https://playwright.dev/) (browser automation), and headless [Chromium](https://www.chromium.org/). |

For details on how I implemented these technologies, see the GitHub repo.

[View site](/) [GitHub](https://github.com/swlsf23/website)

## More to come

I’m working on additional projects in this space.
