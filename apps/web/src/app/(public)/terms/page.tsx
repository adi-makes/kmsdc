import { LegalDocument, assertLegalReviewed } from '@/components/public/legal';
import { PageIntro } from '@/components/public/sections';
import { clinic } from '@/content/clinic-profile';
import { APP_ENV, pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Terms of use',
  description: `Terms of use for the ${clinic.name} website.`,
  path: '/terms',
});

export default function TermsPage() {
  assertLegalReviewed(clinic.legal.termsReviewedOn, 'The terms of use', APP_ENV);
  return (
    <>
      <PageIntro
        title="Terms of use"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of use' }]}
      />
      <LegalDocument reviewedOn={clinic.legal.termsReviewedOn}>
        <p>By using this website you agree to these terms.</p>

        <h2>General information only</h2>
        <p>
          Content on this website is general information about dental care and the clinic&rsquo;s
          services. It is not medical advice and does not replace an examination by a dentist. Do
          not delay seeking care because of something you read here.
        </p>

        <h2>Emergencies</h2>
        <p>
          This website, the enquiry form and WhatsApp are not monitored continuously and must not be
          used for emergencies. For severe pain, swelling, bleeding or injury, seek immediate
          medical care.
        </p>

        <h2>Appointments</h2>
        <p>
          Sending a message or enquiry is a request. An appointment is confirmed only when the
          clinic confirms the date and time with you.
        </p>

        <h2>Fees</h2>
        <p>
          Treatment options and costs are discussed with you at the clinic before treatment begins.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Please do not misuse the website, submit false information or attempt to access systems
          you are not authorised to use.
        </p>

        <h2>Links to other services</h2>
        <p>
          Links to WhatsApp, maps or social media take you to services operated by other companies,
          whose own terms and privacy policies apply.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated from time to time. The latest version will always be on this
          page.
        </p>
      </LegalDocument>
    </>
  );
}
