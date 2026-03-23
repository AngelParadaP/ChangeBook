import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Kyboo <noreply@kyboo.lat>";

/**
 * Envía un correo de recuperación de contraseña con un link para resetear.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName: string
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🔑 Recupera tu contraseña de Kyboo",
      html: `
        <div style="font-family: 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #142536; border-radius: 16px; overflow: hidden; border: 1px solid #1E3A50;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #011C40, #023859); padding: 32px 24px; text-align: center; border-bottom: 2px solid #26658C;">
            <h1 style="color: #A7EBF2; font-size: 28px; margin: 0 0 8px 0; letter-spacing: -0.5px; font-weight: 800;">Kyboo</h1>
            <p style="color: #B8CCDB; font-size: 14px; margin: 0;">Recuperación de contraseña</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="color: #E8F1F8; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
              Hola <strong>${userName}</strong>,
            </p>
            <p style="color: #B8CCDB; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Recibimos una solicitud para restablecer tu contraseña. Haz click en el botón para crear una nueva:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; background: #26658C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(38, 101, 140, 0.3);">
                Restablecer contraseña
              </a>
            </div>

            <p style="color: #7A95AB; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
              Este enlace expira en <strong style="color: #A7EBF2;">1 hora</strong>.<br/>
              Si no solicitaste este cambio, ignora este correo.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; border-top: 1px solid #1E3A50; background: #0D1B2A; text-align: center;">
            <p style="color: #7A95AB; font-size: 11px; margin: 0;">
              © Kyboo — Intercambio de libros UDG
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Error sending password reset:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: "Error al enviar el correo" };
  }
}

/**
 * Envía un correo de verificación de cuenta
 */
export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
  userName: string
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "✨ Verifica tu cuenta de Kyboo",
      html: `
        <div style="font-family: 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #142536; border-radius: 16px; overflow: hidden; border: 1px solid #1E3A50;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #011C40, #023859); padding: 32px 24px; text-align: center; border-bottom: 2px solid #26658C;">
            <h1 style="color: #A7EBF2; font-size: 28px; margin: 0 0 8px 0; letter-spacing: -0.5px; font-weight: 800;">Kyboo</h1>
            <p style="color: #B8CCDB; font-size: 14px; margin: 0;">Verificación de cuenta</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="color: #E8F1F8; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
              Hola <strong>${userName}</strong>,
            </p>
            <p style="color: #B8CCDB; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Gracias por unirte a Kyboo. Por favor, verifica tu cuenta haciendo click en el siguiente botón:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}"
                 style="display: inline-block; background: #26658C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(38, 101, 140, 0.3);">
                Verificar cuenta
              </a>
            </div>

            <p style="color: #7A95AB; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
              Este enlace expira en <strong style="color: #A7EBF2;">24 horas</strong>.<br/>
              Si no creaste esta cuenta, ignora este correo.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; border-top: 1px solid #1E3A50; background: #0D1B2A; text-align: center;">
            <p style="color: #7A95AB; font-size: 11px; margin: 0;">
              © Kyboo — Intercambio de libros UDG
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Error sending verification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: "Error al enviar el correo de verificación" };
  }
}
