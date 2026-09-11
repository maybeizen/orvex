# @orvex/mail

SMTP mailer with HTML template rendering, built on
[nodemailer](https://nodemailer.com/). When SMTP is not configured it degrades
gracefully and skips sending (useful in local/dev).

> [!NOTE]
> Prepared for alert routing; not yet wired into any app.

## Exports

- `createMailer(config)` — returns a `Mailer`
- `loadTemplate(name)` / `renderTemplate(template, data)` — HTML templating
- `MailError`
- Types: `Mailer`, `SmtpConfig`, `MailSendResult`

Ships an example template at `templates/notification.html`.

## Usage

```ts
import { createMailer } from "@orvex/mail";

const mailer = createMailer({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM,
});

await mailer.send({ to: "user@example.com", subject: "Hello", html });
```

When `host` is unset, `send` resolves without dispatching — no error is thrown.

## Scripts

`dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
