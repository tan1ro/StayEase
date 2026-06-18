import LegalPage from '../../../components/LegalPage';

const protectedCharacteristics = [
  'Race',
  'Religion',
  'Gender',
  'Age',
  'Disability',
  'Familial status (having children)',
  'Marital status',
  'Ethnicity',
  'Nation of origin',
  'Sexual orientation',
  'Sex',
  'Gender identity',
  'Caste',
  'Pregnancy and related medical conditions',
];

const sections = [
  {
    id: 'overview',
    title: 'Nondiscrimination Policy',
    paragraphs: [
      'StayEase’s community is composed of hosts and guests from across India who bring different cultures, values, and norms. Our dedication to meaningful travel rests on respect and inclusion. We ask that everyone using StayEase:',
    ],
    list: [
      'Treat each other with respect regardless of race, religion, national origin, ethnicity, disability, sex, gender identity, sexual orientation, age, caste, or other protected characteristics.',
      'Abide by this Nondiscrimination Policy.',
    ],
  },
  {
    id: 'scope',
    title: 'Policy scope',
    paragraphs: [
      'This policy applies to all of StayEase and all listings on our platform — hotel rooms, homestays, and other accommodations.',
      'We prohibit users from discriminating against others on the basis of the following protected characteristics:',
    ],
    list: protectedCharacteristics,
  },
  {
    id: 'language',
    title: 'Discriminatory language',
    paragraphs: [
      'StayEase users may not use language that calls for exclusion, segregation, violence towards, demeans, insults, stereotypes, or conveys a person’s inferiority because of a protected characteristic. This includes slurs, negative associations, misgendering, microaggressions, and other forms of hateful speech.',
    ],
  },
  {
    id: 'symbols',
    title: 'Hateful and discriminatory symbols',
    paragraphs: [
      'Users may not display symbols, objects, logos, slogans, or images that are hateful, stereotype people because of a protected characteristic, or convey a discriminatory meaning.',
    ],
  },
  {
    id: 'refusal',
    title: 'Refusal of service or differential treatment',
    paragraphs: [
      'StayEase users may not treat members of the community differently or deny service because of protected characteristics. Examples include declining or cancelling a booking, imposing different terms or house rules, charging different fees, or indicating a preference for or against a specific type of guest.',
      'Hosts may provide factual information about their listing so guests can decide whether it is appropriate for themselves or their family. The decision to book rests with the guest.',
    ],
  },
  {
    id: 'age-family',
    title: 'Age and familial status',
    paragraphs: [
      'Hosts may not impose different terms or decline a reservation because of a guest’s age or familial status unless required by applicable law or allowed by this policy.',
      'Hosts may provide factually accurate information about listing features, note applicable laws that restrict guests of a particular age or guests with children, and set lawful age minimums where permitted by local regulations — as long as those requirements are applied consistently and disclosed before booking.',
    ],
  },
  {
    id: 'disability',
    title: 'Disability',
    paragraphs: [
      'Hosts may provide information about accessibility features so guests with disabilities can make informed decisions. Hosts may not decide for guests that a listing is unsuitable, prohibit mobility devices, charge extra fees for guests with disabilities (including service animals where applicable), discourage bookings from guests with disabilities, or refuse reasonable communication accommodations.',
    ],
  },
  {
    id: 'gender-identity',
    title: 'Gender identity',
    paragraphs: [
      'StayEase expects our community to respect the self-identified gender of our users. If a user expresses a pronoun preference, that preference should be respected.',
      'Hosts may not deny a reservation because they disagree with a guest’s gender identity. Hosts who share common spaces with guests may, in limited circumstances, make a listing available only to guests of the host’s gender where permitted by law and disclosed clearly.',
    ],
  },
  {
    id: 'law',
    title: 'Terms of service and local law',
    paragraphs: [
      'Our Terms of Service require users to understand and follow laws that apply to them. Where this policy provides more protections and does not conflict with applicable law, we expect users to follow this policy.',
      'If there is no applicable law on a particular issue, this policy governs.',
    ],
  },
  {
    id: 'enforcement',
    title: 'Enforcing this policy',
    paragraphs: [
      'StayEase takes reports of discrimination seriously. If we determine a community member violated this policy, we may educate users, issue warnings, suspend or remove listings, or suspend or remove accounts.',
      'If a guest believes they were denied access or unable to book because of discrimination, they may report the issue to StayEase for investigation.',
    ],
  },
  {
    id: 'report',
    title: 'How to report a violation',
    paragraphs: [
      'If you believe you have been discriminated against, or want to report a user, profile, listing, or message for discriminatory behaviour, contact StayEase support through your account or email support@stayease.com with details of the incident.',
    ],
  },
];

export default function NondiscriminationPolicy() {
  return (
    <LegalPage
      title="Nondiscrimination Policy"
      updated="17 June 2026"
      sections={sections}
    />
  );
}
