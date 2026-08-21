"use client";
import { LegalPageShell } from "../_shared";

const TOC = [
  { id:"s1",  label:"1. Introduction" },
  { id:"s2",  label:"2. Ownership & Business Info" },
  { id:"s3",  label:"3. Nature of Services" },
  { id:"s4",  label:"4. Technology Platform" },
  { id:"s5",  label:"5. User Eligibility" },
  { id:"s6",  label:"6. Booking" },
  { id:"s7",  label:"7. Fare & Pricing" },
  { id:"s8",  label:"8. Tolls, Parking & Charges" },
  { id:"s9",  label:"9. Cancellation" },
  { id:"s10", label:"10. No-Show" },
  { id:"s11", label:"11. Driver Responsibilities" },
  { id:"s12", label:"12. Customer Responsibilities" },
  { id:"s13", label:"13. Prohibited Activities" },
  { id:"s14", label:"14. Payments" },
  { id:"s15", label:"15. Refunds" },
  { id:"s16", label:"16. Promotions & Discounts" },
  { id:"s17", label:"17. Ratings & Reviews" },
  { id:"s18", label:"18. Intellectual Property" },
  { id:"s19", label:"19. Third-Party Services" },
  { id:"s20", label:"20. Location Services" },
  { id:"s21", label:"21. Emergency & Safety" },
  { id:"s22", label:"22. Vehicle & Driver Info" },
  { id:"s23", label:"23. Lost Property" },
  { id:"s24", label:"24. Disclaimer of Warranties" },
  { id:"s25", label:"25. Limitation of Liability" },
  { id:"s26", label:"26. Force Majeure" },
  { id:"s27", label:"27. Account Suspension" },
  { id:"s28", label:"28. Changes to Terms" },
  { id:"s29", label:"29. Governing Law" },
  { id:"s30", label:"30. Contact" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="doc-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function TermsPage() {
  return (
    <LegalPageShell icon="📜" title="Terms & Conditions" subtitle="Governing your use of CAB8.in and all related services" toc={TOC}>

      <Section id="s1" title="1. Introduction">
        <p>Welcome to <strong>CAB8.in</strong>, a technology-enabled transportation and mobility platform operated under the <strong>OrderMint</strong> brand.</p>
        <p>CAB8 is intended to provide technology and digital services connecting passengers/customers with taxi, cab, driver and transportation service providers.</p>
        <p>By accessing, browsing, registering with, or using CAB8.in, its mobile applications, websites, software, APIs, booking systems, customer portals, driver applications, partner portals, or related services, you agree to be bound by these Terms & Conditions. If you do not agree with these Terms, you should not use CAB8 services.</p>
      </Section>

      <Section id="s2" title="2. Ownership and Business Information">
        <p>CAB8 is a brand operated under <strong>OrderMint.in</strong>. The founder/owner of OrderMint and CAB8 is:</p>
        <ul>
          <li><strong>Ritesh Grover</strong></li>
          <li>Himachal Pradesh, District Mandi</li>
          <li>PIN – 175001, India</li>
          <li>Contact: <strong>+91-8679800074</strong></li>
          <li>GSTIN: <strong>02BMAPG7310Q2Z6</strong></li>
        </ul>
        <p>CAB8 may introduce additional legal entities, subsidiaries, affiliates, franchisees, contractors, technology partners or operating partners in the future. Nothing on the CAB8 website should be interpreted as representing that CAB8 is currently a company, LLP, partnership, or other legal entity unless separately stated in the applicable legal documents.</p>
      </Section>

      <Section id="s3" title="3. Nature of CAB8 Services">
        <p>CAB8 provides a technology platform that may facilitate:</p>
        <ul>
          <li>Taxi and cab bookings</li>
          <li>Local transportation</li>
          <li>Outstation transportation</li>
          <li>Airport transfers</li>
          <li>Driver/customer matching</li>
          <li>Ride scheduling</li>
          <li>Ride tracking</li>
          <li>Fare estimation</li>
          <li>Digital payments</li>
          <li>Driver and vehicle partner services</li>
          <li>Customer support</li>
          <li>Transportation-related technology services</li>
          <li>Fleet management</li>
          <li>Corporate transportation</li>
          <li>Other mobility services introduced by CAB8</li>
        </ul>
        <p>CAB8 may add, modify, suspend or discontinue services at any time.</p>
      </Section>

      <Section id="s4" title="4. CAB8 as a Technology Platform">
        <p>Unless expressly stated otherwise for a particular service, CAB8 acts primarily as a <strong>technology platform</strong> facilitating interaction between customers and transportation service providers. The actual transportation service may be performed by an independent driver, taxi operator, fleet owner, travel agency, transportation company or other service provider.</p>
        <p>Where applicable, the driver/service provider remains responsible for: vehicle operation, driver conduct, vehicle maintenance, required permits, insurance, fitness certificates, pollution certificates, commercial vehicle compliance, driver licences, applicable transportation regulations, passenger safety, and compliance with applicable laws.</p>
      </Section>

      <Section id="s5" title="5. User Eligibility">
        <p>You must provide accurate information when creating or using a CAB8 account. Users must:</p>
        <ul>
          <li>Provide accurate personal information</li>
          <li>Maintain the confidentiality of account credentials</li>
          <li>Not create fraudulent accounts</li>
          <li>Not impersonate another person</li>
          <li>Not misuse the platform</li>
          <li>Not use CAB8 for unlawful activities</li>
          <li>Not manipulate fares, bookings, ratings or promotions</li>
          <li>Not interfere with the operation of CAB8</li>
        </ul>
        <p>CAB8 may suspend or terminate accounts where misuse or fraudulent activity is suspected.</p>
      </Section>

      <Section id="s6" title="6. Booking">
        <p>A customer may request a ride through CAB8. A booking request does not necessarily guarantee that a driver will accept the booking. A ride becomes confirmed only when CAB8 or the applicable service provider confirms the booking.</p>
        <p>CAB8 may cancel or modify bookings due to: driver availability, vehicle availability, technical problems, weather, road closures, government restrictions, natural disasters, safety concerns, incorrect booking information, fraudulent activity, or operational circumstances.</p>
      </Section>

      <Section id="s7" title="7. Fare and Pricing">
        <p>The applicable fare may depend upon: distance, time, vehicle category, location, demand, traffic, toll charges, parking charges, state taxes, permit charges, additional waiting time, night charges, additional stops, airport charges, and other applicable charges.</p>
        <p>The estimated fare displayed before booking may not always be the final payable amount where additional charges are applicable.</p>
        <p>Where legally permissible, CAB8 may modify pricing models, commissions, fees and charges.</p>
      </Section>

      <Section id="s8" title="8. Tolls, Parking and Government Charges">
        <p>Unless expressly included in the quoted fare, the customer may be responsible for applicable toll charges, parking charges, entry charges, state taxes, permit charges, airport charges, and other government or authority-imposed charges. Such charges may be added to the final bill.</p>
      </Section>

      <Section id="s9" title="9. Cancellation">
        <p>CAB8 may establish cancellation policies for different categories of bookings. Cancellation charges may apply depending upon time of cancellation, driver arrival status, ride category, distance, booking type, and special booking conditions. The cancellation policy applicable to a particular booking may be displayed during the booking process.</p>
      </Section>

      <Section id="s10" title="10. No-Show">
        <p>If a customer fails to appear at the agreed pickup location within the applicable waiting period, the booking may be treated as a no-show and cancellation charges may apply. Similarly, if a driver fails to arrive without a legitimate reason, CAB8 may take appropriate action against the driver/partner.</p>
      </Section>

      <Section id="s11" title="11. Driver and Partner Responsibilities">
        <p>Drivers and transportation partners using CAB8 must:</p>
        <ul>
          <li>Possess a valid driving licence</li>
          <li>Operate legally permitted vehicles</li>
          <li>Maintain required vehicle documents</li>
          <li>Maintain valid insurance</li>
          <li>Follow applicable motor vehicle laws</li>
          <li>Maintain reasonable vehicle cleanliness</li>
          <li>Treat customers respectfully</li>
          <li>Avoid discriminatory or abusive behaviour</li>
          <li>Not solicit illegal payments</li>
          <li>Not manipulate trip records</li>
          <li>Not misuse customer information</li>
          <li>Follow CAB8 partner requirements</li>
        </ul>
        <p>CAB8 may suspend or remove partners who violate applicable rules.</p>
      </Section>

      <Section id="s12" title="12. Customer Responsibilities">
        <p>Customers must:</p>
        <ul>
          <li>Provide accurate pickup and destination information</li>
          <li>Treat drivers respectfully</li>
          <li>Not damage vehicles</li>
          <li>Not carry prohibited or illegal materials</li>
          <li>Not engage in threatening, abusive or violent behaviour</li>
          <li>Wear seat belts where required</li>
          <li>Follow applicable laws</li>
          <li>Pay applicable charges</li>
          <li>Avoid interfering with vehicle operation</li>
        </ul>
        <p>The customer may be responsible for damage caused intentionally or negligently to a vehicle.</p>
      </Section>

      <Section id="s13" title="13. Prohibited Activities">
        <p>Users may not use CAB8 for: illegal transportation, transportation of prohibited substances, fraud, money laundering, theft, harassment, violence, threats, sexual exploitation, human trafficking, unlawful commercial activities, account manipulation, fake bookings, GPS manipulation, fare manipulation, platform hacking, reverse engineering, unauthorized data extraction, or circumvention of platform security.</p>
        <p>CAB8 may cooperate with law enforcement where legally required.</p>
      </Section>

      <Section id="s14" title="14. Payments">
        <p>CAB8 may support different payment methods, including cash, UPI, cards, online payment gateways, wallets, corporate billing, and other payment methods introduced by CAB8. Third-party payment processors may process online transactions. CAB8 does not store sensitive card information unless expressly stated and legally permitted.</p>
      </Section>

      <Section id="s15" title="15. Refunds">
        <p>Refund eligibility depends upon the circumstances of the transaction and the applicable cancellation/refund policy. Where CAB8 is responsible for processing the refund, approved refunds may be returned through the original payment method or another legally permissible method. Payment gateway processing time may affect the time taken for a refund to reach the customer.</p>
      </Section>

      <Section id="s16" title="16. Promotions and Discounts">
        <p>CAB8 may offer coupons, promotional codes, referral rewards, cashback, discounts, driver incentives, and customer loyalty programmes. Promotions may have separate terms and conditions. CAB8 may cancel promotions where fraudulent use or abuse is detected.</p>
      </Section>

      <Section id="s17" title="17. Ratings and Reviews">
        <p>Customers and drivers may be permitted to submit ratings and reviews. Reviews must be genuine and must not contain threats, defamation, hate speech, personal information, false accusations, illegal content, spam, or commercial advertising. CAB8 may remove content violating its policies.</p>
      </Section>

      <Section id="s18" title="18. Intellectual Property">
        <p>All CAB8 branding, logos, designs, software, website content, graphics, text, interfaces, databases, layouts, trademarks, service marks and related intellectual property are owned by or licensed to OrderMint/CAB8 unless otherwise stated.</p>
        <p>Users may not: copy CAB8 software, reproduce the website, copy branding, create confusingly similar services, scrape platform data, reverse engineer software, reproduce proprietary content, or use CAB8 branding without permission.</p>
        <p>CAB8, CAB8.in, OrderMint, and associated logos/branding may be protected by applicable intellectual-property laws. Registration status, if any, should not be assumed unless specifically stated.</p>
      </Section>

      <Section id="s19" title="19. Third-Party Services">
        <p>CAB8 may integrate third-party services including payment gateways, maps, GPS services, SMS providers, email providers, cloud hosting providers, analytics providers, authentication providers, and communication services. Third-party services may have their own terms and privacy policies. CAB8 is not responsible for independent failures of third-party services beyond its reasonable control.</p>
      </Section>

      <Section id="s20" title="20. Location Services">
        <p>Certain CAB8 features may require location information, used for pickup identification, driver tracking, ride tracking, navigation, estimated arrival time, safety, fraud prevention, and service improvement. Users may disable location permissions, but certain services may become unavailable or less accurate.</p>
      </Section>

      <Section id="s21" title="21. Emergency and Safety">
        <p>CAB8 may introduce emergency assistance and safety features. However, CAB8 is not a replacement for emergency services. In an immediate emergency, users should contact the appropriate local emergency authority. CAB8 may cooperate with authorities when required by law.</p>
      </Section>

      <Section id="s22" title="22. Vehicle and Driver Information">
        <p>CAB8 may display information such as driver name, driver photograph, vehicle registration number, vehicle model, vehicle category, rating, estimated arrival, and trip information. This information is provided to facilitate transportation services and should not be used for unrelated purposes.</p>
      </Section>

      <Section id="s23" title="23. Lost Property">
        <p>CAB8 may provide reasonable assistance in attempting to recover lost property. CAB8 does not guarantee recovery of lost items. Customers should promptly report lost property through the available CAB8 support channels.</p>
      </Section>

      <Section id="s24" title="24. Disclaimer of Warranties">
        <p>CAB8 services are provided on an "as available" and "as is" basis to the extent permitted by law. CAB8 does not guarantee continuous availability, error-free operation, uninterrupted service, exact ETA, exact fare estimates, driver availability, vehicle availability, GPS accuracy, network availability, or third-party service availability.</p>
      </Section>

      <Section id="s25" title="25. Limitation of Liability">
        <p>To the maximum extent permitted under applicable law, CAB8/OrderMint and its owners, employees, contractors, technology providers and affiliates shall not be liable for indirect, incidental, special or consequential losses arising from use of the platform. Nothing in these Terms is intended to exclude liability that cannot legally be excluded under applicable Indian law.</p>
      </Section>

      <Section id="s26" title="26. Force Majeure">
        <p>CAB8 will not be responsible for delays or failures caused by circumstances beyond reasonable control, including natural disasters, floods, landslides, earthquakes, extreme weather, war, riots, government restrictions, strikes, internet outages, telecommunications failures, cyber incidents, road closures, pandemic-related restrictions, or other unforeseen events.</p>
      </Section>

      <Section id="s27" title="27. Account Suspension">
        <p>CAB8 may suspend or terminate an account where there is fraud, abuse, repeated cancellation misuse, payment fraud, harassment, safety concerns, violation of these Terms, illegal activity, or platform manipulation.</p>
      </Section>

      <Section id="s28" title="28. Changes to Terms">
        <p>CAB8 may update these Terms periodically. The updated Terms will be published on the website with a revised effective date. Continued use of CAB8 after changes are published may constitute acceptance of the updated Terms, subject to applicable law.</p>
      </Section>

      <Section id="s29" title="29. Governing Law">
        <p>These Terms shall be governed by the laws of India. Subject to applicable law, disputes shall be subject to the jurisdiction of the competent courts having jurisdiction over Mandi, Himachal Pradesh.</p>
      </Section>

      <Section id="s30" title="30. Contact">
        <p>For questions regarding these Terms:</p>
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
