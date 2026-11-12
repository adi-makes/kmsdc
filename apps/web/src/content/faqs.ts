import { clinic } from './clinic-profile';

/**
 * General FAQs about using the clinic. Answers that depend on clinic facts (hours, prices,
 * insurance) are omitted until the clinic confirms them — never guessed.
 */
export interface Faq {
  question: string;
  answer: string;
}

export function getGeneralFaqs(): Faq[] {
  const faqs: Faq[] = [
    {
      question: 'How do I book an appointment?',
      answer: clinic.whatsappNumber
        ? 'Tap "Book on WhatsApp" and send the prefilled message. Our team will reply to confirm a suitable date and time. You can also send an enquiry through the contact form.'
        : 'Send an enquiry through the contact form and our team will get back to you to arrange a suitable date and time. WhatsApp booking will be available here soon.',
    },
    {
      question: 'Is my appointment confirmed when I send a message?',
      answer:
        'Not yet — a message or enquiry is a request. Your appointment is confirmed once the clinic replies with the date and time.',
    },
    {
      question: 'What should I bring to my first visit?',
      answer:
        'Please bring a list of any medicines you take, details of allergies or medical conditions, and any previous dental X-rays or reports you have.',
    },
    {
      question: 'Can I reschedule or cancel?',
      answer:
        'Yes. Please let the clinic know as early as possible so the time can be offered to another patient.',
    },
    {
      question: 'Do you see children?',
      answer:
        'Yes, the clinic offers pediatric dentistry. A parent or guardian should accompany children to their appointments.',
    },
    {
      question: 'Should I share medical details in WhatsApp or the contact form?',
      answer:
        'Please keep messages to booking details. Your medical and dental history will be taken privately at the clinic.',
    },
    {
      question: 'How is my personal information used?',
      answer:
        'Your details are used to respond to your enquiry and, if you become a patient, to provide care. You can choose separately whether to receive promotional messages. See the privacy policy for details.',
    },
  ];
  return faqs;
}
