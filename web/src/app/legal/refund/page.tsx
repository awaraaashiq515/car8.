"use client";
import { LegalPageShell } from "../_shared";

const TOC = [
  { id:"r1",  label:"1. Customer Cancellation" },
  { id:"r2",  label:"2. Free Cancellation" },
  { id:"r3",  label:"3. After Driver Allocation" },
  { id:"r4",  label:"4. Customer No-Show" },
  { id:"r5",  label:"5. Driver Cancellation" },
  { id:"r6",  label:"6. Driver No-Show" },
  { id:"r7",  label:"7. Driver Valid Reasons" },
  { id:"r8",  label:"8. Refund Eligibility" },
  { id:"r9",  label:"9. Partial Refunds" },
  { id:"r10", label:"10. Non-Refundable Amounts" },
  { id:"r11", label:"11. Failed Payment" },
  { id:"r12", label:"12. Duplicate Payment" },
  { id:"r13", label:"13. Cash Refunds" },
  { id:"r14", label:"14. Digital Payment Refunds" },
  { id:"r15", label:"15. Chargebacks" },
  { id:"r16", label:"16. Fraudulent Requests" },
  { id:"r17", label:"17. Promotional Credits" },
  { id:"r18", label:"18. Refund Request" },
  { id:"r19", label:"19. Refund Review" },
  { id:"r20", label:"20. Refund Timeline" },
  { id:"r21", label:"21. Corporate Bookings" },
  { id:"r22", label:"22. Outstation Bookings" },
  { id:"r23", label:"23. Airport Bookings" },
  { id:"r24", label:"24. Scheduled Rides" },
  { id:"r25", label:"25. Tolls and Parking" },
  { id:"r26", label:"26. Fare Disputes" },
  { id:"r27", label:"27. Driver Payment Adjustment" },
  { id:"r28", label:"28. Tax Adjustments" },
  { id:"r29", label:"29. Final Decision" },
  { id:"r30", label:"30. Grievance / Support" },
];

function Section({ id, title, children }: { id:string; title:string; children:React.ReactNode }) {
  return (
    <div id={id} className="doc-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function RefundPage() {
  return (
    <LegalPageShell icon="💳" title="Cancellation & Refund Policy" subtitle="Rules governing ride cancellation, no-shows, refunds and disputes" toc={TOC}>

      <Section id="r1" title="1. Customer Cancellation">
        <p>A customer may cancel a booking through CAB8. Cancellation charges, where applicable, may depend upon time elapsed after booking, driver acceptance, driver distance from pickup, driver arrival, trip status, vehicle category, booking type, and applicable promotional terms.</p>
      </Section>

      <Section id="r2" title="2. Free Cancellation">
        <p>CAB8 may provide a free cancellation period. Where a ride is cancelled within the applicable free-cancellation period, no cancellation charge may be applied. The exact free-cancellation period may be displayed in the app.</p>
      </Section>

      <Section id="r3" title="3. Customer Cancellation After Driver Allocation">
        <p>If a customer cancels after a driver has accepted the ride, a cancellation charge may apply where permitted by CAB8 policy and applicable law. The amount may be displayed before or after cancellation depending upon the technical flow.</p>
      </Section>

      <Section id="r4" title="4. Customer No-Show">
        <p>A customer may be considered a no-show if the driver reaches the pickup location, waits for the applicable waiting period, the customer does not appear, and the driver follows CAB8's no-show procedure. A no-show fee may apply.</p>
      </Section>

      <Section id="r5" title="5. Driver Cancellation">
        <p>Drivers should not cancel accepted bookings without legitimate reason. Driver cancellation may be recorded for operational monitoring. Repeated unjustified cancellations may result in reduced allocation, penalties, incentive restrictions, temporary suspension, or account review.</p>
        <div style={{ marginTop:12, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:10, padding:"10px 14px" }}>
          <p style={{ margin:0, fontSize:12, color:"#F87171", lineHeight:1.6 }}><strong>⚠️ Note:</strong> The applicable regulatory framework must be considered when setting cancellation penalties. CAB8 shall not simply copy any historical rule into its current policy without checking the applicable 2025/state framework.</p>
        </div>
      </Section>

      <Section id="r6" title="6. Driver No-Show">
        <p>If a driver fails to reach the pickup location without a legitimate reason, CAB8 may: waive customer cancellation charges, refund applicable charges, provide customer credits, record driver misconduct, and take partner action.</p>
      </Section>

      <Section id="r7" title="7. Driver-Initiated Cancellation for Valid Reasons">
        <p>Valid reasons may include: unsafe location, road closure, vehicle breakdown, accident, emergency, passenger misconduct, passenger requesting unlawful activity, incorrect pickup, safety concern, government restriction, or other legitimate circumstances. CAB8 may require evidence where appropriate.</p>
      </Section>

      <Section id="r8" title="8. Refund Eligibility">
        <p>A customer may qualify for a refund where:</p>
        <ul>
          <li>CAB8 charged an amount incorrectly or a duplicate payment occurred</li>
          <li>The ride was cancelled but improperly charged</li>
          <li>The driver failed to provide the service</li>
          <li>The customer was charged for a technical error</li>
          <li>CAB8 determines that compensation is appropriate</li>
        </ul>
      </Section>

      <Section id="r9" title="9. Partial Refunds">
        <p>CAB8 may provide partial refunds where only part of a service was affected.</p>
      </Section>

      <Section id="r10" title="10. Non-Refundable Amounts">
        <p>Where legally permissible, the following may be non-refundable: valid cancellation fees, valid no-show fees, completed-trip charges, applicable tolls, parking charges, government charges, and other properly incurred charges.</p>
      </Section>

      <Section id="r11" title="11. Failed Payment">
        <p>If a payment fails but the customer's account is debited, CAB8 may wait for confirmation from the payment provider before processing the refund.</p>
      </Section>

      <Section id="r12" title="12. Duplicate Payment">
        <p>Where CAB8 confirms a duplicate payment, the duplicate amount may be refunded.</p>
      </Section>

      <Section id="r13" title="13. Cash Refunds">
        <p>Cash ride refunds may be processed through CAB8 wallet, bank transfer, UPI, the original payment method where applicable, or another approved method. CAB8 may request bank/UPI verification.</p>
      </Section>

      <Section id="r14" title="14. Digital Payment Refunds">
        <p>Where possible, refunds will be processed through the original payment channel. The payment provider's processing time may affect the actual credit date.</p>
      </Section>

      <Section id="r15" title="15. Chargebacks">
        <p>A customer initiating a payment chargeback should provide accurate information. CAB8 may contest fraudulent or invalid chargebacks with appropriate evidence.</p>
      </Section>

      <Section id="r16" title="16. Fraudulent Refund Requests">
        <p>CAB8 may reject refund claims involving false information, fake screenshots, repeated abuse, collusion, fake bookings, manipulation, or payment fraud.</p>
      </Section>

      <Section id="r17" title="17. Promotional Credits">
        <p>Promotional credits may have an expiry date, be non-transferable, not be convertible to cash, and be subject to specific promotional terms.</p>
      </Section>

      <Section id="r18" title="18. Refund Request">
        <p>A customer may be required to provide: booking ID, transaction ID, date/time, payment information, reason for refund, and supporting documents where necessary.</p>
      </Section>

      <Section id="r19" title="19. Refund Review">
        <p>CAB8 may review GPS records, booking records, driver location, app logs, payment records, customer communications, driver communications, trip route, and photographs/videos where available.</p>
      </Section>

      <Section id="r20" title="20. Refund Timeline">
        <p>CAB8 will process approved refunds within a reasonable period. Actual receipt of funds may depend upon the payment provider or banking system.</p>
      </Section>

      <Section id="r21" title="21. Corporate Bookings">
        <p>Corporate accounts may be governed by separate contractual cancellation and refund arrangements.</p>
      </Section>

      <Section id="r22" title="22. Outstation Bookings">
        <p>Outstation or scheduled bookings may have different cancellation rules because vehicles may be reserved in advance. The applicable cancellation terms should be displayed before confirmation where practicable.</p>
      </Section>

      <Section id="r23" title="23. Airport Bookings">
        <p>Airport transfers may have special cancellation and waiting-time conditions.</p>
      </Section>

      <Section id="r24" title="24. Scheduled Rides">
        <p>Scheduled rides may have cancellation windows specified at the time of booking.</p>
      </Section>

      <Section id="r25" title="25. Tolls and Parking">
        <p>Where a trip has legitimately incurred toll or parking charges, such amounts may not automatically qualify for refund even if the passenger disputes another component of the fare.</p>
      </Section>

      <Section id="r26" title="26. Fare Disputes">
        <p>Customers may challenge a fare where they believe the wrong distance was calculated, the wrong vehicle category was charged, an unauthorized fee was applied, a duplicate payment occurred, or the fare differed from the applicable booking terms. CAB8 may investigate and adjust the transaction where appropriate.</p>
      </Section>

      <Section id="r27" title="27. Driver Payment Adjustment">
        <p>Where CAB8 refunds a customer due to a Partner-related issue, CAB8 may adjust the Partner's settlement where contractually and legally permitted.</p>
      </Section>

      <Section id="r28" title="28. Tax Adjustments">
        <p>Refunds, credit notes and tax adjustments will be handled according to applicable GST and tax requirements.</p>
      </Section>

      <Section id="r29" title="29. Final Decision">
        <p>CAB8 may investigate each dispute based on available records. Nothing in this Policy limits rights available to customers or Partners under applicable law.</p>
      </Section>

      <Section id="r30" title="30. Grievance / Support">
        <p>Cancellation and refund disputes should be raised through CAB8's official support channels.</p>
        <ul>
          <li><strong>CAB8 / OrderMint</strong></li>
          <li>Founder: <strong>Ritesh Grover</strong></li>
          <li>District Mandi, Himachal Pradesh – 175001, India</li>
          <li>Phone: <strong>+91-8679800074</strong></li>
          <li>GSTIN: <strong>02BMAPG7310Q2Z6</strong></li>
        </ul>
      </Section>

    </LegalPageShell>
  );
}
