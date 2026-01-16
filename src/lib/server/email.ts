import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// Create transporter based on environment variables
// For production, use real SMTP credentials
// For development, you can use services like Mailtrap, Ethereal, or a real SMTP server
function createTransporter() {
	const host = env.SMTP_HOST;
	const port = parseInt(env.SMTP_PORT || '587');
	const user = env.SMTP_USER;
	const pass = env.SMTP_PASS;

	if (!host || !user || !pass) {
		console.warn(
			'SMTP environment variables not fully configured. Email sending will be simulated.'
		);
		// Return null to indicate emails should be logged instead of sent
		return null;
	}

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // true for 465, false for other ports
		auth: {
			user,
			pass
		}
	});
}

const transporter = createTransporter();

export interface EmailOptions {
	to: string;
	subject: string;
	text: string;
	html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
	const fromAddress = env.SMTP_FROM || 'noreply@smartbuilders.de';

	if (!transporter) {
		// Log the email for development/testing when SMTP is not configured
		console.log('='.repeat(60));
		console.log('📧 EMAIL SIMULATION (SMTP not configured)');
		console.log('='.repeat(60));
		console.log(`To: ${options.to}`);
		console.log(`From: ${fromAddress}`);
		console.log(`Subject: ${options.subject}`);
		console.log('-'.repeat(60));
		console.log('Text Content:');
		console.log(options.text);
		console.log('='.repeat(60));
		return true; // Return true so the flow continues
	}

	try {
		const info = await transporter.sendMail({
			from: fromAddress,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html
		});

		console.log('Email sent successfully:', info.messageId);
		return true;
	} catch (error) {
		console.error('Failed to send email:', error);
		return false;
	}
}

export interface PasswordResetNotificationResult {
	type: 'PASSWORD_RESET_EMAIL';
	an: string;
	betreff: string;
	resetLink: string;
	nachricht: string;
}

export async function sendPasswordResetEmail(
	email: string,
	resetToken: string,
	baseUrl: string
): Promise<{ success: boolean; notification: PasswordResetNotificationResult }> {
	const resetLink = `${baseUrl}/passwort-zuruecksetzen/${resetToken}`;

	const subject = 'Smart Builders - Passwort zurücksetzen';

	const text = `
Hallo,

Sie haben angefordert, Ihr Passwort für das Smart Builders Portal zurückzusetzen.

Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:
${resetLink}

Dieser Link ist 1 Stunde gültig.

Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.

Mit freundlichen Grüßen,
Ihr Smart Builders Team
`;

	const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Smart Builders</h1>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1e293b; margin-top: 0;">Passwort zurücksetzen</h2>

        <p>Hallo,</p>

        <p>Sie haben angefordert, Ihr Passwort für das Smart Builders Portal zurückzusetzen.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="display: inline-block; background: #1e293b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Passwort zurücksetzen
            </a>
        </div>

        <p style="font-size: 14px; color: #64748b;">
            Oder kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${resetLink}" style="color: #6366f1; word-break: break-all;">${resetLink}</a>
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Hinweis:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig.
            </p>
        </div>

        <p style="color: #64748b; font-size: 14px;">
            Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt unverändert.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
            Mit freundlichen Grüßen,<br>
            Ihr Smart Builders Team
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
        &copy; 2026 Smart Builders GmbH
    </div>
</body>
</html>
`;

	const emailResult = await sendEmail({
		to: email,
		subject,
		text,
		html
	});

	const notification: PasswordResetNotificationResult = {
		type: 'PASSWORD_RESET_EMAIL',
		an: email,
		betreff: subject,
		resetLink,
		nachricht: text.trim()
	};

	return { success: emailResult, notification };
}

/**
 * Notification data for customer updates.
 * Since this is a university project, we return the data for browser console logging.
 */
export interface CustomerNotificationData {
	auftragsnummer: string;
	schrittTitel: string;
	neuerStatus: string;
	fortschritt: number;
	projektId: string;
	kundenname: string;
	baseUrl: string;
}

export interface CustomerNotificationResult {
	type: 'CUSTOMER_NOTIFICATION';
	an: string;
	betreff: string;
	auftragsnummer: string;
	projektschritt: string;
	neuerStatus: string;
	fortschritt: number;
	projektLink: string;
	nachricht: string;
}

export function notifyCustomerAboutStepUpdate(
	data: CustomerNotificationData
): CustomerNotificationResult {
	const projektLink = `${data.baseUrl}/projekt/${data.projektId}`;

	// Map status to German readable text
	const statusMap: Record<string, string> = {
		offen: 'Offen',
		in_bearbeitung: 'In Bearbeitung',
		in_arbeit: 'In Arbeit',
		fertig: 'Abgeschlossen',
		pausiert: 'Pausiert'
	};

	const statusText = statusMap[data.neuerStatus] || data.neuerStatus;

	const nachricht = `Sehr geehrte/r ${data.kundenname},

es gibt ein neues Update zu Ihrem Projekt:

  📋 Auftragsnummer: ${data.auftragsnummer}
  🔧 Projektschritt: ${data.schrittTitel}
  ✅ Neuer Status:   ${statusText}
  📊 Fortschritt:    ${data.fortschritt}%

Sehen Sie alle Details auf Ihrer Projektseite:
  🔗 ${projektLink}

Mit freundlichen Grüßen,
Ihr Smart Builders Team`;

	return {
		type: 'CUSTOMER_NOTIFICATION',
		an: data.kundenname,
		betreff: `Update zu Ihrem Projekt ${data.auftragsnummer}`,
		auftragsnummer: data.auftragsnummer,
		projektschritt: data.schrittTitel,
		neuerStatus: statusText,
		fortschritt: data.fortschritt,
		projektLink,
		nachricht
	};
}
