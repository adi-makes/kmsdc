/**
 * Service pages: general patient education only.
 *
 * Rules (docs/product/master-specification.md §7, Module K):
 *  - No prices, success rates, guarantees, "painless"/"best" claims or comparisons.
 *  - Describe what a treatment generally involves; the dentist decides what is suitable.
 *  - Every page needs dentist review before it can be published to production
 *    (`reviewedBy` + `reviewedOn`). Production builds fail while any page is unreviewed.
 */

export type ServiceSlug =
  | 'general-dentistry'
  | 'root-canal-treatment'
  | 'teeth-whitening'
  | 'dental-implants'
  | 'braces-and-orthodontics'
  | 'pediatric-dentistry'
  | 'dental-x-rays'
  | 'other-dental-procedures';

export interface ServiceContent {
  slug: ServiceSlug;
  name: string;
  /** One sentence for cards and meta descriptions (≤ 160 chars). */
  summary: string;
  intro: string;
  sections: { heading: string; body?: string; points?: string[] }[];
  faqs: { question: string; answer: string }[];
  review: {
    status: 'pending-dentist-review' | 'approved';
    reviewedBy?: string;
    reviewedOn?: string;
  };
}

const PENDING = { status: 'pending-dentist-review' } as const;

export const SERVICES: readonly ServiceContent[] = [
  {
    slug: 'general-dentistry',
    name: 'General dentistry',
    summary:
      'Check-ups, cleaning and everyday dental care to keep teeth and gums healthy and catch problems early.',
    intro:
      'General dentistry covers the routine care most people need throughout life: examinations, professional cleaning, fillings and advice on looking after your teeth and gums at home.',
    sections: [
      {
        heading: 'What it can include',
        points: [
          'Dental examination of teeth, gums and mouth',
          'Professional cleaning (scaling and polishing)',
          'Fillings for decayed or damaged teeth',
          'Advice on brushing, flossing and diet',
          'Referral or planning for further treatment when needed',
        ],
      },
      {
        heading: 'What to expect at a visit',
        body: 'The dentist will ask about any concerns and your medical history, examine your mouth and explain what they find. If treatment is needed, the options, number of visits and costs are discussed with you before anything is started.',
      },
      {
        heading: 'Please tell us about',
        points: [
          'Medicines you take and any allergies',
          'Medical conditions such as diabetes, heart conditions or pregnancy',
          'Previous dental treatment or problems',
        ],
      },
    ],
    faqs: [
      {
        question: 'How often should I have a dental check-up?',
        answer:
          'It depends on your oral health. Your dentist will recommend a suitable interval after examining you.',
      },
    ],
    review: PENDING,
  },
  {
    slug: 'root-canal-treatment',
    name: 'Root canal treatment',
    summary:
      'Treatment for an infected or inflamed tooth nerve that aims to save the natural tooth.',
    intro:
      'Inside every tooth is soft tissue called the pulp. When it becomes inflamed or infected — often from deep decay, a crack or injury — root canal treatment cleans and seals the inside of the tooth so it can be kept.',
    sections: [
      {
        heading: 'Signs you may need an examination',
        body: 'These signs do not always mean root canal treatment is needed; only an examination (often with an X-ray) can tell.',
        points: [
          'Lingering sensitivity to hot or cold',
          'Pain when biting or chewing',
          'Swelling or a pimple-like bump on the gum',
          'Darkening of a tooth',
        ],
      },
      {
        heading: 'What the treatment generally involves',
        points: [
          'Local anaesthetic to numb the area',
          'Removing the inflamed or infected pulp',
          'Cleaning, shaping and disinfecting the root canals',
          'Filling and sealing the canals',
          'Restoring the tooth — often with a crown, as advised by your dentist',
        ],
      },
      {
        heading: 'Number of visits',
        body: 'Treatment may be completed in one or more visits depending on the tooth and the infection. Your dentist will explain the plan for your case.',
      },
    ],
    faqs: [
      {
        question: 'Will I need a crown afterwards?',
        answer:
          'Many back teeth need a crown after root canal treatment to protect them, but your dentist will advise based on how much tooth structure remains.',
      },
    ],
    review: PENDING,
  },
  {
    slug: 'teeth-whitening',
    name: 'Teeth whitening',
    summary:
      'Dentist-supervised whitening to lighten natural tooth colour, after checking it is suitable for you.',
    intro:
      'Teeth whitening uses bleaching agents to lighten the natural colour of teeth. A dental examination comes first, because whitening is not suitable for everyone and does not change the colour of fillings, crowns or veneers.',
    sections: [
      {
        heading: 'Before whitening',
        points: [
          'Examination to check teeth and gums are healthy',
          'Treatment of decay or gum problems first, if present',
          'Discussion of realistic expectations — results vary from person to person',
        ],
      },
      {
        heading: 'Things to know',
        points: [
          'Temporary sensitivity can occur during or after whitening',
          'Existing fillings and crowns will not change colour',
          'Results fade over time depending on diet and habits',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is whitening suitable during pregnancy?',
        answer:
          'Whitening is usually postponed during pregnancy and breastfeeding. Please discuss this with the dentist.',
      },
    ],
    review: PENDING,
  },
  {
    slug: 'dental-implants',
    name: 'Dental implants',
    summary:
      'A way to replace missing teeth using a post placed in the jawbone that supports a crown, bridge or denture.',
    intro:
      'A dental implant is a small post, usually titanium, placed in the jawbone where a tooth is missing. Once it has bonded with the bone, it can support a crown, a bridge or a denture.',
    sections: [
      {
        heading: 'Assessment',
        body: 'Implants are planned carefully. The dentist will review your medical history, examine your mouth and take X-rays or scans to check whether there is enough healthy bone and whether an implant is a suitable option for you.',
      },
      {
        heading: 'Typical stages',
        points: [
          'Consultation, examination and imaging',
          'Placement of the implant under local anaesthetic',
          'A healing period while the implant bonds with the bone',
          'Fitting the final crown, bridge or denture',
        ],
      },
      {
        heading: 'Factors your dentist will consider',
        points: [
          'Bone volume and gum health',
          'Smoking and medical conditions such as uncontrolled diabetes',
          'Other options such as bridges or dentures',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long does the whole process take?',
        answer:
          'It varies with each case, mainly because of the healing period. The dentist will give you an estimated timeline after assessment.',
      },
    ],
    review: PENDING,
  },
  {
    slug: 'braces-and-orthodontics',
    name: 'Braces and orthodontics',
    summary:
      'Treatment to straighten teeth and correct bite problems for children, teenagers and adults.',
    intro:
      'Orthodontic treatment gradually moves teeth into better positions using braces or other appliances. It can improve how teeth bite together and make them easier to clean.',
    sections: [
      {
        heading: 'Common reasons for orthodontic treatment',
        points: [
          'Crowded or widely spaced teeth',
          'Protruding front teeth',
          'Overbite, underbite or crossbite',
        ],
      },
      {
        heading: 'What to expect',
        points: [
          'Assessment with photographs, X-rays and impressions or scans',
          'A treatment plan explaining the appliance and estimated duration',
          'Regular adjustment visits',
          'Retainers after treatment to keep teeth in position',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is there an age limit for braces?',
        answer:
          'Orthodontic treatment is possible for many adults as well as children. Suitability depends on the health of the teeth and gums.',
      },
    ],
    review: PENDING,
  },
  {
    slug: 'pediatric-dentistry',
    name: 'Pediatric dentistry',
    summary:
      "Gentle dental care for babies, children and teenagers, and guidance for parents on children's oral health.",
    intro:
      "Children's teeth need care from the first tooth onwards. Pediatric dental visits focus on prevention, early detection of problems and helping children feel comfortable at the dentist.",
    sections: [
      {
        heading: 'Care for children can include',
        points: [
          'Check-ups and cleaning',
          'Advice for parents on brushing, diet and habits',
          'Fluoride application and fissure sealants where recommended',
          'Fillings and treatment for decayed milk teeth',
          'Monitoring the development of teeth and jaws',
        ],
      },
      {
        heading: 'Helping your child feel at ease',
        body: 'Talk positively about the visit and bring any questions you have. A parent or guardian should accompany children to their appointments.',
      },
    ],
    faqs: [
      {
        question: "When should my child's first dental visit be?",
        answer:
          "Dental associations generally advise a first visit around the time the first tooth appears or by the child's first birthday. The dentist can advise based on your child's needs.",
      },
    ],
    review: PENDING,
  },
  {
    slug: 'dental-x-rays',
    name: 'Dental X-rays',
    summary:
      'Dental radiographs that help the dentist see what cannot be seen during a visual examination.',
    intro:
      'Dental X-rays show areas between and inside teeth, the roots and the surrounding bone. They help the dentist diagnose problems and plan treatment.',
    sections: [
      {
        heading: 'When X-rays may be advised',
        points: [
          'To check for decay between teeth or under fillings',
          'Before root canal treatment, extractions or implants',
          'To check the development of teeth in children',
        ],
      },
      {
        heading: 'Safety',
        body: 'X-rays are taken only when the dentist considers them necessary. Please tell the team if you are, or may be, pregnant.',
      },
    ],
    faqs: [],
    review: PENDING,
  },
  {
    slug: 'other-dental-procedures',
    name: 'Other dental procedures',
    summary:
      'Other treatments such as extractions, gum treatment, crowns, bridges and dentures, as advised by your dentist.',
    intro:
      'Depending on your needs, the dentist may recommend other treatments. They will explain the options, what each involves and the expected number of visits and costs before starting.',
    sections: [
      {
        heading: 'Examples',
        points: [
          'Tooth extraction, including wisdom teeth assessment',
          'Gum (periodontal) treatment',
          'Crowns and bridges',
          'Complete and partial dentures',
        ],
      },
      {
        heading: 'Not sure what you need?',
        body: 'Book a consultation. The dentist will examine you and explain the options.',
      },
    ],
    faqs: [],
    review: PENDING,
  },
];

export function getService(slug: string): ServiceContent | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/**
 * Production builds must not publish clinical content that a dentist has not approved.
 * Called from the service pages at build time.
 */
export function assertPublishable(service: ServiceContent, appEnv: string | undefined): void {
  if (appEnv === 'production' && service.review.status !== 'approved') {
    throw new Error(
      `Service page "${service.slug}" has not been approved by a dentist and cannot be published to production.`,
    );
  }
}
