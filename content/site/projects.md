---
slug: projects
title: Projects
---

These are projects I built and maintain, with links to live sites and source code.

## Personal website

Client-side React app with Markdown-authored content generated at build time. This project demonstrates my ability to use the following technologies:

| Layer | Details |
| --- | --- |
| Infrastructure | Infrastructure is defined and deployed with [Terraform](https://www.terraform.io/). The static site is served from [Amazon S3](https://aws.amazon.com/s3/) behind [Amazon CloudFront](https://aws.amazon.com/cloudfront/). |
| CI/CD | [GitHub Actions](https://github.com/features/actions) build and deploy the site on every push to `main`. |
| Webapp | The UI is a single-page [React](https://react.dev/) app built with [Vite](https://vitejs.dev/) and [TypeScript](https://www.typescriptlang.org/). |
| PDF generation | Resume and writing samples are rendered to PDF with [marked](https://marked.js.org/) (Markdown to HTML), [Playwright](https://playwright.dev/) (browser automation), and headless [Chromium](https://www.chromium.org/). |

For details on how I implemented these technologies, see the GitHub repo.

[View site](/) [GitHub](https://github.com/swlsf23/website)

## More to come

I have additional portfolio projects in the pipeline, including:

- A doc site infrastructure that implements AI in the doc production workflow.
- Data visualization projects.
- Language learning tools that leverage LLMs.
