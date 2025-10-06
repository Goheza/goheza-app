// lib/supportData.ts

export type Role = 'admin' | 'band' | 'creator';

export interface ContactChannel {
  id: string;
  icon: string; // Use icon library like Lucide or Feather
  title: string;
  description: string;
  ctaText: string; // Call-to-Action Text
  href: string; // Link for email, WhatsApp, or form page
  isExternal: boolean;
}

export const contactChannels: ContactChannel[] = [
  {
    id: 'email',
    icon: 'mail',
    title: 'Email Support',
    description: 'Best for detailed questions, account issues, or bug reports. Our team responds within 24 hours.',
    ctaText: 'info@goheza.com',
    href: 'mailto:info@goheza.com',
    isExternal: true,
  },
  {
    id: 'whatsapp',
    icon: 'message-circle',
    title: 'WhatsApp Chat',
    description: 'Quick answers and immediate help during business hours (Mon-Fri, 9am-5pm EST).',
    ctaText: 'Chat Now',
    href: 'https://wa.me/256776007962?text=Hi%20Goheza%20Support,', // Replace with your number
    isExternal: true,
  },
  {
    id: 'form',
    icon: 'file-text',
    title: 'Submit a Request',
    description: 'For structured inquiries like feature requests, reporting abuse, or custom integration questions.',
    ctaText: 'Open Contact Form',
    href: '/main/#contactus', // Internal link to a dedicated form page
    isExternal: false,
  },
];