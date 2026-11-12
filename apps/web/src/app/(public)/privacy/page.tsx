import { Placeholder } from '@kmsdc/ui';
import { LegalDocument, assertLegalReviewed } from '@/components/public/legal';
import { PageIntro } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { APP_ENV, pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Privacy policy',
  description: `How ${clinic.name} collects, uses and protects personal information.`,
  path: '/privacy',
});

export default function PrivacyPage() {
  assertLegalReviewed(clinic.legal.privacyPolicyReviewedOn, 'The privacy policy', APP_ENV);
  const officer = clinic.legal.grievanceOfficerName;
  const officerEmail = clinic.legal.grievanceOfficerEmail ?? clinic.email;
  return (
    <>
      <PageIntro
        title="Privacy policy"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy policy' }]}
      />
      <LegalDocument reviewedOn={clinic.legal.privacyPolicyReviewedOn}>
        <p>
          This policy explains how {clinic.name} (&ldquo;the clinic&rdquo;, &ldquo;we&rdquo;)
          handles personal information collected through this website, WhatsApp and at the clinic,
          in line with India&rsquo;s Digital Personal Data Protection Act, 2023 and applicable
          rules.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Contact details you give us: name, phone number, email address.</li>
          <li>
            Enquiry details: the service you are interested in, your preferred time and your
            message.
          </li>
          <li>
            If you become a patient: identity details, medical and dental history, treatment
            records, X-rays and billing information, recorded at the clinic.
          </li>
          <li>
            Basic technical information needed to run the website securely (for example, IP address
            in server logs).
          </li>
        </ul>

        <h2>Why we use it</h2>
        <ul>
          <li>To respond to your enquiry and arrange appointments.</li>
          <li>To provide dental care and keep clinical records.</li>
          <li>To send appointment confirmations and reminders, if you agree.</li>
          <li>To send health tips or clinic updates — only if you separately opt in.</li>
          <li>To meet legal, accounting and record-keeping obligations.</li>
        </ul>

        <h2>Your consent and choices</h2>
        <p>
          We ask for consent for each purpose separately: clinical care, appointment communication,
          and promotional messages. Promotional consent is always optional. You can withdraw consent
          at any time by replying STOP to a message or by contacting the clinic; this does not
          affect care you have already received or records we must keep by law.
        </p>

        <h2>Who we share it with</h2>
        <p>
          We do not sell personal information. We share it only with service providers who help us
          operate (for example, secure hosting and messaging services), under appropriate
          safeguards, or where required by law. Messages we send never include details of your
          diagnosis or treatment unless you have asked us to.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Enquiries that do not lead to a visit are deleted after a limited period. Clinical and
          billing records are kept for the periods required by applicable medical and tax
          regulations.
        </p>

        <h2>How we protect it</h2>
        <p>
          Access to patient records is limited to authorised staff based on their role, actions on
          sensitive records are logged, and data is stored on secured systems.
        </p>

        <h2>Your rights</h2>
        <p>
          You may ask to access, correct or erase your personal information, and to nominate another
          person to exercise your rights. Some records must be retained by law even after a request.
        </p>

        <h2>Contact and grievances</h2>
        <p>
          For privacy questions or complaints, contact:{' '}
          {officer ? officer : <Placeholder>grievance officer name</Placeholder>}
          {officerEmail ? (
            <>
              {' '}
              at{' '}
              <a href={`mailto:${officerEmail}`} className="text-fg-link underline">
                {officerEmail}
              </a>
            </>
          ) : (
            <>
              {' '}
              <Placeholder>contact email</Placeholder>
            </>
          )}
          . If you are not satisfied with our response, you may approach the Data Protection Board
          of India.
        </p>
      </LegalDocument>
    </>
  );
}
