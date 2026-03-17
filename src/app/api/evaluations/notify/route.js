// app/api/evaluations/notify/route.js
import { NextResponse } from "next/server";
import nodemailer       from "nodemailer";

// ── Create transporter once ──
const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT),
    secure: true, // true for port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ── Email HTML template ──
function buildEmailHTML({ teamName }) {

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Evaluation Complete</title>
    </head>
    <body style="margin:0; padding:0; background:#f9fafb; font-family:sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#f9fafb; padding:40px 16px;">
            <tr>
                <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0"
                           style="background:#ffffff; border:1px solid #e5e7eb;
                                  max-width:560px; width:100%;">

                        <!-- Header -->
                        <tr>
                            <td style="padding:32px 32px 24px;
                                       border-bottom:1px solid #f3f4f6;">
                                <p style="margin:0 0 4px; font-family:monospace;
                                          font-size:11px; color:#9ca3af;
                                          text-transform:uppercase;
                                          letter-spacing:0.1em;">
                                    ProtoTech
                                </p>
                                <h1 style="margin:0; font-size:22px; font-weight:800;
                                           color:#111827; letter-spacing:-0.03em;">
                                    Evaluation Complete
                                </h1>
                            </td>
                        </tr>

                        <!-- Message -->
                        <tr>
                            <td style="padding:32px 32px;">
                                <p style="margin:0; font-size:14px;
                                          color:#374151; line-height:1.6;">
                                    Hi <strong>${teamName}</strong>,
                                </p>
                                <p style="margin:12px 0 0; font-size:14px;
                                          color:#374151; line-height:1.6;">
                                    Your team's evaluation is complete.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding:20px 32px 32px;
                                       border-top:1px solid #f3f4f6;">
                                <p style="margin:0; font-family:monospace;
                                          font-size:11px; color:#d1d5db;
                                          text-transform:uppercase;
                                          letter-spacing:0.1em;">
                                    ProtoTech · This is an automated message. Please do not reply.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>

    </body>
    </html>
    `;
}

export async function POST(req) {
    try {
        const body = await req.json();
        console.log("Request body:", body);
        
        const { teamName, teamEmail } = body;

        if (!teamEmail) {
            return NextResponse.json(
                { error: "No team email provided" },
                { status: 400 }
            );
        }

        const html = buildEmailHTML({
            teamName,
        });

        console.log("Sending email to:", teamEmail);
        await transporter.sendMail({
            from:    `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
            to:      teamEmail,
            subject: `✓ ${teamName} — Evaluation Complete | ProtoTech`,
            html,
            text:    `Hi ${teamName}, your team's evaluation is complete.`,
        });

        console.log("Email sent successfully");
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Error:", err);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        return NextResponse.json(
            { error: err.message || "Failed to send email" },
            { status: 500 }
        );
    }
}