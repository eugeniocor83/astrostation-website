// ═══════════════════════════════════════════════════════════════
// ASTRO STATION — Form submission emails
// Netlify event function: fires automatically on every VERIFIED
// (spam-filtered) Netlify Forms submission ("submission-created").
//
// For each submission it sends, via Resend (https://resend.com):
//   1. A branded confirmation email to the person who submitted.
//   2. A branded internal notification to the studio.
//
// Configuration (Netlify → Site → Environment variables):
//   RESEND_API_KEY     required — the Resend API key (secret)
//   EMAIL_FROM         optional — default "Astro Station <info@astrostation.com>"
//   EMAIL_INTERNAL_TO  optional — comma-separated, default
//                      "eu@astrostation.com,info@astrostation.com"
//
// If RESEND_API_KEY is not set, the function logs and exits cleanly,
// so form submissions are never blocked by email configuration.
// ═══════════════════════════════════════════════════════════════

const SITE = 'https://www.astrostation.com';
const STAR = `${SITE}/img/brand/star.png`;

const DEFAULT_FROM = 'Astro Station <info@astrostation.com>';
const DEFAULT_INTERNAL_TO = 'eu@astrostation.com,info@astrostation.com';

// ── Helpers ─────────────────────────────────────────────────────

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const firstName = (name) => {
  const n = String(name || '').trim().split(/\s+/)[0] || '';
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'Hello';
};

const fileUrl = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v.url) return v.url;
  return '';
};

const env = (key, fallback) => {
  try {
    if (typeof Netlify !== 'undefined' && Netlify.env) return Netlify.env.get(key) || fallback;
  } catch { /* local render */ }
  return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
};

// ── Shared email shell (table-based, inline styles, B&W editorial) ──

const FONT_DISPLAY = "'Saira','Helvetica Neue',Helvetica,Arial,sans-serif";
const FONT_BODY = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";
const FONT_MONO = "'JetBrains Mono',Menlo,Consolas,'Courier New',monospace";

function shell({ preheader, content, footerNote }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Saira:wght@600;700;800&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap');
  a { color:inherit; }
</style>
</head>
<body style="margin:0;padding:0;background:#F8F8F8;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8F8;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#FFFFFF;border:1px solid #EAEAEA;border-top:4px solid #000000;">

    <!-- Header -->
    <tr><td style="padding:44px 48px 36px 48px;border-bottom:1px solid #EAEAEA;" align="center">
      <img src="${STAR}" width="30" height="30" alt="✦" style="display:block;margin:0 auto 16px auto;width:30px;height:30px;">
      <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:22px;letter-spacing:6px;color:#000000;text-transform:uppercase;">ASTRO&nbsp;STATION</div>
      <div style="font-family:${FONT_MONO};font-size:10px;letter-spacing:4px;color:#777777;text-transform:uppercase;padding-top:10px;">MIAMI&nbsp;&middot;&nbsp;LOS&nbsp;ANGELES</div>
    </td></tr>

    ${content}

    <!-- Footer -->
    <tr><td style="background:#000000;padding:36px 48px;" align="center">
      <div style="font-family:${FONT_MONO};font-size:10px;letter-spacing:3px;color:#FFFFFF;text-transform:uppercase;padding-bottom:14px;">ARCHITECTURE&nbsp;&middot;&nbsp;INTERIORS&nbsp;&middot;&nbsp;MILLWORK&nbsp;&middot;&nbsp;CONSTRUCTION</div>
      <div style="font-family:${FONT_BODY};font-weight:300;font-size:12px;line-height:1.7;color:#BBBBBB;">
        Bespoke homes designed and delivered as one.<br>
        <a href="tel:+17869091565" style="color:#FFFFFF;text-decoration:none;">+1&nbsp;786&nbsp;909&nbsp;1565</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:info@astrostation.com" style="color:#FFFFFF;text-decoration:none;">info@astrostation.com</a>
        &nbsp;&middot;&nbsp;
        <a href="https://www.instagram.com/astrostation.co" style="color:#FFFFFF;text-decoration:none;">@astrostation.co</a>
      </div>
      <div style="font-family:${FONT_BODY};font-weight:300;font-size:11px;color:#777777;padding-top:18px;">
        &copy; Astro Station 2026 &middot; All rights reserved &middot; <a href="${SITE}" style="color:#777777;text-decoration:underline;">astrostation.com</a>
      </div>
      ${footerNote ? `<div style="font-family:${FONT_BODY};font-weight:300;font-size:11px;color:#777777;padding-top:10px;">${footerNote}</div>` : ''}
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

const label = (txt) =>
  `<div style="font-family:${FONT_MONO};font-size:10px;letter-spacing:4px;color:#777777;text-transform:uppercase;padding-bottom:18px;">${txt}</div>`;

const headline = (txt) =>
  `<div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:34px;line-height:1.02;letter-spacing:-0.5px;color:#000000;text-transform:uppercase;padding-bottom:26px;">${txt}</div>`;

const para = (txt) =>
  `<p style="font-family:${FONT_BODY};font-weight:300;font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 18px 0;">${txt}</p>`;

const button = (href, txt, solid = true) =>
  `<a href="${href}" style="display:inline-block;font-family:${FONT_DISPLAY};font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:15px 30px;margin:4px 8px 4px 0;${solid
    ? 'background:#000000;color:#FFFFFF;border:1px solid #000000;'
    : 'background:#FFFFFF;color:#000000;border:1px solid #000000;'}">${txt}&nbsp;&nbsp;&rarr;</a>`;

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 1 — Careers / Join the Crew · confirmation to applicant
// ═══════════════════════════════════════════════════════════════

export function careersAutoReply(data) {
  const fn = firstName(data.name);
  const content = `
    <tr><td style="padding:48px 48px 8px 48px;">
      ${label('CAREERS&nbsp;&middot;&nbsp;JOIN&nbsp;THE&nbsp;CREW')}
      ${headline('Your signal has<br>reached the studio.')}
      ${para(`${esc(fn)} &mdash;`)}
      ${para(`Thank you for introducing yourself to Astro Station. Your signal came through clearly, and it now sits with the crew &mdash; not in a stack, not in a system, but on the desks of the people who decide who flies with us.`)}
      ${para(`We don&rsquo;t post openings and we don&rsquo;t collect applications. We listen. Astro Station holds the entire residential journey under one roof &mdash; architecture, interiors, millwork, landscape, and construction &mdash; and we crew it the way you crew a flight: small, senior, fully in command of the systems, accountable for every coordinate. We hire infrequently and carefully, because the work of building a home is a long mission, and every seat matters.`)}
    </td></tr>

    <tr><td style="padding:8px 48px 8px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid #EAEAEA;padding:26px 0 0 0;">
          ${label('01&nbsp;&mdash;&nbsp;THE&nbsp;REVIEW')}
          ${para(`Every signal that reaches the studio is read personally by a principal &mdash; the work you&rsquo;ve shared, the way you think, the mission you say you&rsquo;re after. No filters, no software deciding for us.`)}
        </td>
      </tr><tr>
        <td style="border-top:1px solid #EAEAEA;padding:26px 0 0 0;">
          ${label('02&nbsp;&mdash;&nbsp;THE&nbsp;RESPONSE')}
          ${para(`If there&rsquo;s a fit, a member of the crew will reach out within <span style="color:#000000;font-weight:400;">ten business days</span> to begin the conversation. If the timing isn&rsquo;t right, your signal stays on our radar &mdash; when the right mission takes shape, we know where to find you.`)}
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:10px 48px 48px 48px;">
      ${para(`Until then &mdash; welcome to the orbit.`)}
      ${para(`<span style="color:#000000;">&mdash; The Astro Station Crew</span><br><span style="font-family:${FONT_MONO};font-size:11px;letter-spacing:2px;color:#777777;">MIAMI&nbsp;&middot;&nbsp;LOS&nbsp;ANGELES</span>`)}
      <div style="padding-top:14px;">
        ${button(`${SITE}/about`, 'MEET THE CREW')}
        ${button(`${SITE}/work`, 'SEE THE WORK', false)}
      </div>
    </td></tr>`;

  return shell({
    preheader: 'Your introduction has reached the studio. Every signal is read by a principal.',
    content,
    footerNote: 'You are receiving this confirmation because you introduced yourself at astrostation.com/careers.',
  });
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 2 — General project / information inquiry · confirmation
// ═══════════════════════════════════════════════════════════════

export function contactAutoReply(data) {
  const fn = firstName(data.name);
  const content = `
    <tr><td style="padding:48px 48px 8px 48px;">
      ${label('CONTACT&nbsp;&middot;&nbsp;ASTRO&nbsp;STATION')}
      ${headline('Your inquiry is in<br>the right hands.')}
      ${para(`${esc(fn)} &mdash;`)}
      ${para(`Thank you for reaching out to Astro Station. Your inquiry has arrived at the studio, and a member of our team is reviewing it now &mdash; we will respond within <span style="color:#000000;font-weight:400;">one business day</span> with next steps and a proposed agenda for our first conversation: thirty minutes, no charge, no commitment.`)}
    </td></tr>

    <tr><td style="padding:8px 48px 8px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid #EAEAEA;padding:26px 0 0 0;">
          ${label('01&nbsp;&mdash;&nbsp;ONE&nbsp;STUDIO,&nbsp;ONE&nbsp;SIGNATURE')}
          ${para(`Astro Station holds the entire residential journey under one roof &mdash; architecture, interiors, millwork, landscape, and construction &mdash; so the line we draw is the line we build. One crew, one set of standards, one finished home that reads as a single idea.`)}
        </td>
      </tr><tr>
        <td style="border-top:1px solid #EAEAEA;padding:26px 0 0 0;">
          ${label('02&nbsp;&mdash;&nbsp;WHAT&nbsp;YOU&nbsp;CAN&nbsp;EXPECT')}
          ${para(`An open-book budget from day one. Weekly transparency &mdash; daily site photos, written reports, every decision logged. And a relationship that doesn&rsquo;t end at handover. We never draw the same house twice; yours will be an answer to your question alone.`)}
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:10px 48px 48px 48px;">
      ${para(`While you wait, the work is the best introduction we have.`)}
      ${para(`<span style="color:#000000;">&mdash; The Astro Station Crew</span><br><span style="font-family:${FONT_MONO};font-size:11px;letter-spacing:2px;color:#777777;">MIAMI&nbsp;&middot;&nbsp;LOS&nbsp;ANGELES</span>`)}
      <div style="padding-top:14px;">
        ${button(`${SITE}/work`, 'SEE THE WORK')}
        ${button(`${SITE}/services`, 'EXPLORE SERVICES', false)}
      </div>
    </td></tr>`;

  return shell({
    preheader: 'Your inquiry has reached the studio. We will respond within one business day.',
    content,
    footerNote: 'You are receiving this confirmation because you contacted us at astrostation.com/contact.',
  });
}

// ═══════════════════════════════════════════════════════════════
// Internal notifications — clean data cards for the studio inbox
// ═══════════════════════════════════════════════════════════════

function dataRows(rows) {
  return rows
    .filter(([, v]) => v)
    .map(
      ([k, v, isLink]) => `
      <tr>
        <td style="font-family:${FONT_MONO};font-size:10px;letter-spacing:2px;color:#777777;text-transform:uppercase;padding:12px 16px 12px 0;border-top:1px solid #EAEAEA;vertical-align:top;white-space:nowrap;">${k}</td>
        <td style="font-family:${FONT_BODY};font-weight:400;font-size:14px;line-height:1.6;color:#111111;padding:12px 0;border-top:1px solid #EAEAEA;vertical-align:top;">${
          isLink ? `<a href="${esc(v)}" style="color:#111111;">${esc(v)}</a>` : esc(v)
        }</td>
      </tr>`
    )
    .join('');
}

export function careersInternal(data) {
  const pf = fileUrl(data.portfolio_file);
  const content = `
    <tr><td style="padding:44px 48px 44px 48px;">
      ${label('INTERNAL&nbsp;&middot;&nbsp;NEW&nbsp;SIGNAL&nbsp;&middot;&nbsp;CAREERS')}
      ${headline('New signal<br>received.')}
      ${para(`A new introduction just arrived through <span style="color:#000000;">Join the Crew</span>. Reply directly to this email to respond to ${esc(firstName(data.name))}.`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
        ${dataRows([
          ['NAME', data.name],
          ['EMAIL', data.email],
          ['PHONE', data.phone],
          ['BASED IN', data.location],
          ['DISCIPLINE', data.discipline],
          ['LICENSE', data.license],
          ['PORTFOLIO', data.portfolio_link, true],
          ['FILE', pf, true],
        ])}
        <tr>
          <td style="font-family:${FONT_MONO};font-size:10px;letter-spacing:2px;color:#777777;text-transform:uppercase;padding:12px 16px 12px 0;border-top:1px solid #EAEAEA;vertical-align:top;">MESSAGE</td>
          <td style="font-family:${FONT_BODY};font-weight:300;font-size:14px;line-height:1.7;color:#111111;padding:12px 0;border-top:1px solid #EAEAEA;">${esc(data.message).replace(/\n/g, '<br>')}</td>
        </tr>
      </table>
      <div style="padding-top:26px;">
        ${data.email ? button(`mailto:${encodeURIComponent(data.email)}`, 'REPLY TO ' + esc(firstName(data.name)).toUpperCase()) : ''}
        ${button('https://app.netlify.com/projects/dapper-praline-b86a61/forms', 'ALL SUBMISSIONS', false)}
      </div>
    </td></tr>`;

  return shell({
    preheader: `Careers signal from ${data.name || 'unknown'} — ${data.discipline || ''}`,
    content,
    footerNote: 'Internal notification · astrostation.com careers form.',
  });
}

export function contactInternal(data) {
  const content = `
    <tr><td style="padding:44px 48px 44px 48px;">
      ${label('INTERNAL&nbsp;&middot;&nbsp;NEW&nbsp;PROJECT&nbsp;INQUIRY')}
      ${headline('New inquiry<br>received.')}
      ${para(`A new project inquiry just arrived through the contact page. The studio promise is a response within <span style="color:#000000;">one business day</span> &mdash; reply directly to this email to respond to ${esc(firstName(data.name))}.`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
        ${dataRows([
          ['NAME', data.name],
          ['EMAIL', data.email],
          ['PHONE', data.phone],
          ['LOCATION', data.location],
          ['SERVICE', data.service],
          ['BUDGET', data.budget],
          ['TARGET START', data.start],
        ])}
        <tr>
          <td style="font-family:${FONT_MONO};font-size:10px;letter-spacing:2px;color:#777777;text-transform:uppercase;padding:12px 16px 12px 0;border-top:1px solid #EAEAEA;vertical-align:top;">BRIEF</td>
          <td style="font-family:${FONT_BODY};font-weight:300;font-size:14px;line-height:1.7;color:#111111;padding:12px 0;border-top:1px solid #EAEAEA;">${esc(data.brief).replace(/\n/g, '<br>')}</td>
        </tr>
      </table>
      <div style="padding-top:26px;">
        ${data.email ? button(`mailto:${encodeURIComponent(data.email)}`, 'REPLY TO ' + esc(firstName(data.name)).toUpperCase()) : ''}
        ${button('https://app.netlify.com/projects/dapper-praline-b86a61/forms', 'ALL SUBMISSIONS', false)}
      </div>
    </td></tr>`;

  return shell({
    preheader: `Inquiry from ${data.name || 'unknown'} — ${data.service || ''} ${data.budget ? '· ' + data.budget : ''}`,
    content,
    footerNote: 'Internal notification · astrostation.com contact form.',
  });
}

// ── Resend delivery ─────────────────────────────────────────────

async function sendEmail(apiKey, msg) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body}`);
  return body;
}

// ── Handler ─────────────────────────────────────────────────────

export default async (req) => {
  let payload;
  try {
    ({ payload } = await req.json());
  } catch (e) {
    console.error('submission-created: could not parse event body', e);
    return new Response('bad payload', { status: 400 });
  }

  const formName = payload?.form_name || '';
  const data = payload?.data || {};
  console.log(`submission-created: form="${formName}" from="${data.email || 'n/a'}"`);

  const apiKey = env('RESEND_API_KEY', '');
  if (!apiKey) {
    console.warn('submission-created: RESEND_API_KEY not set — emails skipped. Add it in Netlify env vars.');
    return new Response('ok (no email key configured)', { status: 200 });
  }

  const from = env('EMAIL_FROM', DEFAULT_FROM);
  const internalTo = env('EMAIL_INTERNAL_TO', DEFAULT_INTERNAL_TO).split(',').map((s) => s.trim()).filter(Boolean);

  const jobs = [];

  if (formName === 'careers') {
    if (data.email) {
      jobs.push(sendEmail(apiKey, {
        from,
        to: [data.email],
        reply_to: 'info@astrostation.com',
        subject: 'Signal received — Astro Station',
        html: careersAutoReply(data),
      }));
    }
    jobs.push(sendEmail(apiKey, {
      from,
      to: internalTo,
      reply_to: data.email || undefined,
      subject: `New Signal · Careers — ${data.name || 'Unknown'}${data.discipline ? ' · ' + data.discipline : ''}`,
      html: careersInternal(data),
    }));
  } else if (formName === 'contact') {
    if (data.email) {
      jobs.push(sendEmail(apiKey, {
        from,
        to: [data.email],
        reply_to: 'info@astrostation.com',
        subject: 'Inquiry received — Astro Station',
        html: contactAutoReply(data),
      }));
    }
    jobs.push(sendEmail(apiKey, {
      from,
      to: internalTo,
      reply_to: data.email || undefined,
      subject: `New Inquiry — ${data.name || 'Unknown'}${data.service ? ' · ' + data.service : ''}${data.budget ? ' · ' + data.budget : ''}`,
      html: contactInternal(data),
    }));
  } else {
    console.warn(`submission-created: unknown form "${formName}" — no emails sent.`);
    return new Response('ok (unknown form)', { status: 200 });
  }

  const results = await Promise.allSettled(jobs);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`submission-created: email ${i} failed —`, r.reason);
    else console.log(`submission-created: email ${i} sent —`, r.value);
  });

  const failed = results.filter((r) => r.status === 'rejected').length;
  return new Response(failed ? `sent with ${failed} failure(s)` : 'ok', { status: 200 });
};
