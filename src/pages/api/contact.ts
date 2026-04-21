import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { siteConfig } from '../../config/site';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxBodySizeBytes = 16 * 1024;
const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'] as const;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const normalizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\0/g, '').replace(/\r\n/g, '\n').slice(0, maxLength);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getEnvValue = (runtimeValue: string | undefined, buildValue: string | undefined) =>
  runtimeValue ?? buildValue;

const getEnv = () => ({
  SMTP_HOST: getEnvValue(process.env.SMTP_HOST, import.meta.env.SMTP_HOST),
  SMTP_PORT: getEnvValue(process.env.SMTP_PORT, import.meta.env.SMTP_PORT),
  SMTP_USER: getEnvValue(process.env.SMTP_USER, import.meta.env.SMTP_USER),
  SMTP_PASS: getEnvValue(process.env.SMTP_PASS, import.meta.env.SMTP_PASS),
  SMTP_SECURE: getEnvValue(process.env.SMTP_SECURE, import.meta.env.SMTP_SECURE),
  SMTP_FROM_EMAIL: getEnvValue(process.env.SMTP_FROM_EMAIL, import.meta.env.SMTP_FROM_EMAIL),
  SMTP_FROM_NAME: getEnvValue(process.env.SMTP_FROM_NAME, import.meta.env.SMTP_FROM_NAME),
  CONTACT_TO_EMAIL: getEnvValue(process.env.CONTACT_TO_EMAIL, import.meta.env.CONTACT_TO_EMAIL),
});

const missingEnv = (env: ReturnType<typeof getEnv>) => requiredEnv.filter((key) => !env[key]);

const createTransport = (env: ReturnType<typeof getEnv>) => {
  const port = Number.parseInt(env.SMTP_PORT ?? '465', 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid SMTP_PORT configuration.');
  }

  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465;

  const transportOptions: SMTPTransport.Options = {
    host: env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  };

  return nodemailer.createTransport(transportOptions);
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatSentAt = (value: Date) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);

export const POST: APIRoute = async ({ request }) => {
  const env = getEnv();
  const contentType = request.headers.get('content-type') ?? '';
  const contentLength = request.headers.get('content-length');

  if (!contentType.includes('application/json')) {
    return json(415, {
      ok: false,
      message: 'Unsupported request format.',
    });
  }

  if (contentLength && Number.parseInt(contentLength, 10) > maxBodySizeBytes) {
    return json(413, {
      ok: false,
      message: 'Request payload is too large.',
    });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json(400, {
      ok: false,
      message: 'Invalid request body.',
    });
  }

  if (!isPlainObject(payload)) {
    return json(400, {
      ok: false,
      message: 'Invalid request body.',
    });
  }

  const name = normalizeText(payload.name, 120);
  const email = normalizeText(payload.email, 160);
  const subject = normalizeText(payload.subject, 160);
  const message = normalizeText(payload.message, 5000);
  const company = normalizeText(payload.company, 120);

  if (company) {
    return json(200, {
      ok: true,
      message: 'Message sent successfully.',
    });
  }

  if (!name || !email || !subject || !message) {
    return json(400, {
      ok: false,
      message: 'Please complete all fields before sending.',
    });
  }

  if (name.length < 2) {
    return json(400, {
      ok: false,
      message: 'Please enter your name.',
    });
  }

  if (!emailPattern.test(email)) {
    return json(400, {
      ok: false,
      message: 'Please enter a valid email address.',
    });
  }

  if (subject.length < 3) {
    return json(400, {
      ok: false,
      message: 'Please add a short subject.',
    });
  }

  if (message.length < 10) {
    return json(400, {
      ok: false,
      message: 'Please provide enough detail for a useful reply.',
    });
  }

  if (missingEnv(env).length > 0) {
    return json(500, {
      ok: false,
      message: 'Contact service is not configured yet.',
    });
  }

  const to = env.CONTACT_TO_EMAIL ?? siteConfig.email;
  const fromAddress = env.SMTP_FROM_EMAIL ?? env.SMTP_USER ?? siteConfig.email;

  if (!emailPattern.test(to) || !emailPattern.test(fromAddress)) {
    return json(500, {
      ok: false,
      message: 'Contact service is not configured yet.',
    });
  }

  const fromName = normalizeText(env.SMTP_FROM_NAME ?? `${siteConfig.name} Portfolio`, 120);
  const from = `"${fromName.replaceAll('"', '\\"')}" <${fromAddress}>`;
  const sentAt = formatSentAt(new Date());
  const mailSubject = `Portfolio Contact: ${subject}`;
  const textBody = [
    `${siteConfig.name} portfolio contact submission`,
    '',
    `From: ${name}`,
    `From Email: ${email}`,
    `Subject: ${subject}`,
    `Sent At: ${sentAt}`,
    '',
    'Message:',
    message,
  ].join('\n');
  const htmlBody = `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a; padding: 24px; background: #f8fafc;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="padding: 20px 24px; background: #020617; color: #67e8f9;">
          <h2 style="margin: 0; font-size: 20px;">${escapeHtml(siteConfig.name)} Portfolio</h2>
          <p style="margin: 6px 0 0; color: #cbd5e1;">New contact submission</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 12px;"><strong>From:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 0 0 12px;"><strong>From Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 0 0 12px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p style="margin: 0 0 20px;"><strong>Sent At:</strong> ${escapeHtml(sentAt)}</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="margin: 0 0 10px;"><strong>Message</strong></p>
            <pre style="margin: 0; white-space: pre-wrap; font-family: Inter, Arial, sans-serif; color: #334155;">${escapeHtml(message)}</pre>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = createTransport(env);

    await transporter.sendMail({
      from,
      to,
      replyTo: {
        address: email,
        name,
      },
      subject: mailSubject,
      text: textBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Contact API mail delivery failed:', error);

    return json(500, {
      ok: false,
      message: 'Unable to deliver your message right now.',
    });
  }

  return json(200, {
    ok: true,
    message: 'Message sent successfully.',
  });
};
