
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.error('SendGrid API key not found');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export const generateConfirmationCode = () => 
  Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');

export const sendConfirmationEmail = async (email: string, code: string) => {
  const msg = {
    to: email,
    from: 'no-reply@huewave.com',
    subject: 'Confirm Your HueWave Account',
    html: `
      <h1>Welcome to HueWave!</h1>
      <p>Your confirmation code is: <strong>${code}</strong></p>
      <p>This code will expire in 15 minutes.</p>
    `,
  };
  
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send confirmation email');
  }
};
