---
slug: projects
title: Projets
---

Voici des projets que j’ai réalisés ou que je maintiens, avec des liens vers les sites en ligne et le code source.

## Site personnel

Ce site fait partie de mon portfolio : application React côté client, contenu Markdown généré au moment du build. Voici comment je l’ai mis en œuvre, couche par couche :

| Couche | Détails |
| --- | --- |
| Infrastructure | L’infrastructure est définie et déployée avec [Terraform](https://www.terraform.io/) ; le site statique est servi depuis [Amazon S3](https://aws.amazon.com/s3/) derrière [Amazon CloudFront](https://aws.amazon.com/cloudfront/). |
| CI/CD | Le site est construit et déployé avec [GitHub Actions](https://github.com/features/actions) à chaque push sur `main`. |
| Application web | L’interface est une application [React](https://react.dev/) construite avec [Vite](https://vitejs.dev/) et [TypeScript](https://www.typescriptlang.org/). |
| Génération PDF | Le CV et les textes d’exemple sont rendus en PDF avec [marked](https://marked.js.org/) (Markdown vers HTML), [Playwright](https://playwright.dev/) (automatisation du navigateur) et [Chromium](https://www.chromium.org/) en mode sans interface. |

[Voir le site](/) [GitHub](https://github.com/swlsf23/website)

## À venir

D’autres projets seront listés ici au fur et à mesure de leur publication.
