"use client";
import { LegalPageShell } from "../_shared";

const TOC = [
  { id:"intro", label:"Introduction" },
  { id:"p1",  label:"1. Information We Collect" },
  { id:"p2",  label:"2. Device Information" },
  { id:"p3",  label:"3. How We Use Information" },
  { id:"p4",  label:"4. Location Data" },
  { id:"p5",  label:"5. Payment Information" },
  { id:"p6",  label:"6. Cookies" },
  { id:"p7",  label:"7. Sharing Information" },
  { id:"p8",  label:"8. Driver-Customer Sharing" },
  { id:"p9",  label:"9. Data Security" },
  { id:"p10", label:"10. Data Retention" },
  { id:"p11", label:"11. Children's Privacy" },
  { id:"p12", label:"12. User Rights" },
  { id:"p13", label:"13. Marketing Communications" },
  { id:"p14", label:"14. Third-Party Websites" },
  { id:"p15", label:"15. Changes to Privacy Policy" },
  { id:"p16", label:"16. Privacy Contact" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="doc-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPageShell icon="🔒" title="Privacy Policy" subtitle="How CAB8 collects, uses, stores and protects your personal information" toc={TOC}>

      <div id="intro" className="doc-section">
        <p style={{ margin: 0 }}>
          <strong>Effective Date: 20 August 2026</strong>
        </p>
        <p style={{ marginTop: 10, marginBottom: 0 }}>
          CAB8, operated under OrderMint, respects your privacy and is committed to protecting personal information collected through CAB8.in, applications, booking systems and related services.
        </p>
      </div>

      <Section id="p1" title="1. Information We Collect">
        <p><strong>Personal information:</strong> Name, mobile number, email address, address, profile information.</p>
        <p><strong>Booking information:</strong> Pickup location, destination, booking time, ride history, vehicle category, payment information, cancellation information.</p>
        <p><strong>Location information:</strong> GPS location, pickup coordinates, destination coordinates, trip route information, location history associated with rides.</p>
        <p><strong>Driver information:</strong> Drivers/partners may provide name, phone number, photograph, driving licence information, vehicle registration details, vehicle documents, insurance information, permit information, bank/payment details, and tax information.</p>
      </Section>

      <Section id="p2" title="2. Device Information">
        <p>We may collect technical information including IP address, device type, operating system, browser, app version, device identifiers, crash information, and log information.</p>
      </Section>

      <Section id="p3" title="3. How We Use Information">
        <p>CAB8 may use information to: create and manage accounts, process bookings, match customers and drivers, provide transportation services, process payments, provide customer support, send booking notifications, send OTPs, track rides, improve safety, prevent fraud, resolve disputes, improve platform performance, analyse usage, comply with legal obligations, and send promotional communications where permitted.</p>
      </Section>

      <Section id="p4" title="4. Location Data">
        <p>Location information may be required to provide core transportation functionality — for example, to identify pickup location, locate nearby drivers, calculate route distance, provide ETA, track an active ride, and improve safety. Location data will be handled in accordance with applicable law and the permissions granted by the user.</p>
      </Section>

      <Section id="p5" title="5. Payment Information">
        <p>Online payments may be processed through third-party payment processors. CAB8 may receive transaction-related information such as transaction ID, payment status, amount, payment method, and refund status. Sensitive payment credentials may be processed directly by payment service providers.</p>
      </Section>

      <Section id="p6" title="6. Cookies">
        <p>CAB8 may use cookies and similar technologies for login sessions, website functionality, analytics, security, preferences, performance, and marketing where legally permitted. Users may control cookies through browser settings, although disabling certain cookies may affect website functionality.</p>
      </Section>

      <Section id="p7" title="7. Sharing Information">
        <p>CAB8 may share information where necessary with drivers, taxi operators, fleet partners, payment providers, maps/GPS providers, cloud service providers, SMS/email providers, customer-support providers, analytics providers, technology providers, legal advisers, and government authorities where legally required. CAB8 does not intend to sell personal information in violation of applicable law.</p>
      </Section>

      <Section id="p8" title="8. Driver-Customer Information Sharing">
        <p>When a booking is made, certain information may be shared between the customer and driver as necessary to facilitate the ride, including name, pickup location, destination, phone/contact functionality, and booking details.</p>
      </Section>

      <Section id="p9" title="9. Data Security">
        <p>CAB8 will take reasonable technical and organisational measures intended to protect personal information against unauthorized access, loss, misuse or disclosure. However, no internet-based system can be guaranteed to be completely secure.</p>
      </Section>

      <Section id="p10" title="10. Data Retention">
        <p>CAB8 may retain information for as long as reasonably necessary for providing services, account management, legal compliance, tax/accounting requirements, fraud prevention, dispute resolution, security, and business records. Information may be deleted or anonymised when it is no longer reasonably required, subject to legal obligations.</p>
      </Section>

      <Section id="p11" title="11. Children's Privacy">
        <p>CAB8 services are not intended to be used independently by children where applicable law requires parental consent. CAB8 does not knowingly collect children's personal information for purposes prohibited by applicable law.</p>
      </Section>

      <Section id="p12" title="12. User Rights">
        <p>Subject to applicable law, users may have rights concerning access to personal information, correction of inaccurate information, deletion, withdrawal of consent where applicable, grievance redressal, and other rights available under applicable Indian data-protection law. Requests may be made using the contact details provided below.</p>
      </Section>

      <Section id="p13" title="13. Marketing Communications">
        <p>CAB8 may send service-related communications such as booking confirmations, OTPs, ride notifications, cancellation notifications, payment notifications, and security alerts. Promotional communications may be sent where permitted by law and applicable consent/preferences.</p>
      </Section>

      <Section id="p14" title="14. Third-Party Websites">
        <p>CAB8 may contain links to third-party websites or services. CAB8 is not responsible for the privacy practices of independent third parties. Users should review the privacy policies of third-party services.</p>
      </Section>

      <Section id="p15" title="15. Changes to Privacy Policy">
        <p>CAB8 may update this Privacy Policy from time to time. The latest version will be published on CAB8.in.</p>
      </Section>

      <Section id="p16" title="16. Privacy Contact">
        <p>For privacy-related questions or requests:</p>
        <ul>
          <li><strong>Ritesh Grover</strong>, Founder – OrderMint / CAB8</li>
          <li>Himachal Pradesh, District Mandi – 175001, India</li>
          <li>Phone: <strong>+91-8679800074</strong></li>
          <li>GSTIN: <strong>02BMAPG7310Q2Z6</strong></li>
        </ul>
      </Section>

    </LegalPageShell>
  );
}
