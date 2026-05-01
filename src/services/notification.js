import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { env } from '../config/env.js';

sgMail.setApiKey(env.sendgridApiKey);

export const sendWithSendgrid = async ({ to, from, subject, text }) => {
  await sgMail.send({ to, from, subject, text });
};

export const sendWithSmtp = async ({ to, from, subject, text }) => {
  const transport = nodemailer.createTransport({ sendmail: true });
  await transport.sendMail({ to, from, subject, text });
};
