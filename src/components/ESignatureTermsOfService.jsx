import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';

const ESignatureTermsOfService = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs gap-1.5"
          data-testid="esignature-tos-btn"
        >
          <Scale className="w-3.5 h-3.5" />
          Terms of Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0" data-testid="esignature-tos-dialog">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            eSignature Terms of Service
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Munal AI &mdash; Powered by Munal AI &bull; Effective as of: April 4, 2026
          </p>
        </DialogHeader>
        <ScrollArea className="h-[65vh] px-6 py-4">
          <div className="prose prose-sm dark:prose-invert prose-slate max-w-none text-sm leading-relaxed space-y-6">

            <p className="text-slate-600 dark:text-slate-300">
              These Terms of Service (the &ldquo;Terms&rdquo;) are an agreement between (a) a User and (b) Munal AI Inc (&ldquo;Munal AI&rdquo;), the company powering Munal AI, that governs access to and use of the Munal AI eSignature service (&ldquo;Service&rdquo;) by Senders and Recipients. A User means either a Sender or a Recipient as further described in these Terms.
            </p>

            <p className="text-slate-600 dark:text-slate-300">
              By agreeing to use the Service &ndash; including to upload or deliver a Contract (as a Sender) or to open, review, decline or electronically sign a Contract (as Recipient) &ndash; User agrees to these Terms. Additionally:
            </p>

            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>If User is an entity, User acknowledges and agrees that the individual who accepts these Terms is authorized to do so on User&rsquo;s behalf and that User agrees to be bound to these Terms pursuant to such individual&rsquo;s acceptance.</li>
              <li>A Sender&rsquo;s use of the Service is subject to the Munal AI Product Terms governing Sender&rsquo;s use of the Online Services and applicable product documentation, in addition to these Terms. In the event of a conflict between these Terms and Sender&rsquo;s Munal AI Product Terms, these Terms will control solely to the extent of such conflict and solely as it applies to Sender&rsquo;s use of the Service under these Terms.</li>
              <li>Recipient&rsquo;s use of the Service is only possible due to Sender&rsquo;s subscription under which Sender acquired a license for the Services from Munal AI Inc. Recipient acknowledges and consents with the terms of the Munal AI Privacy Statement, which describes the types of data that Munal AI Inc collects from Recipient and Recipient&rsquo;s devices, how Munal AI Inc uses Recipient&rsquo;s data, and the legal bases Munal AI Inc has to process such data; as well as how Munal AI Inc uses Recipient&rsquo;s content, which includes content contained within communications with others via the Services.</li>
            </ul>

            {/* THE SERVICE */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">THE SERVICE</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li>The Service enables Users to send and receive terms, agreements and other contracts in electronic form (&ldquo;Contracts&rdquo;) to or from other Users, and to capture a User&rsquo;s electronic signature to such Contract. User&rsquo;s use of the Service is as one of two types of Users: (a) a &ldquo;Sender&rdquo; or (b) a &ldquo;Recipient.&rdquo;</li>
              <li>The Service is intended only for use with Contracts that accept electronic signatures as defined under applicable Canadian federal and provincial law, including the Personal Information Protection and Electronic Documents Act (PIPEDA), the Uniform Electronic Commerce Act (UECA), and applicable provincial Electronic Commerce or Electronic Transactions Acts (collectively, &ldquo;Canadian E-Commerce Laws&rdquo;). The electronic signatures utilized within this Service are &ldquo;electronic signatures&rdquo; as contemplated by Part 2 of PIPEDA and applicable provincial legislation, and do not constitute &ldquo;secure electronic signatures&rdquo; as defined under the Secure Electronic Signature Regulations (SOR/2005-30) made pursuant to PIPEDA. Users are responsible for the collection and preservation of documents and materials that substantiate and prove the due execution of the relevant documents and shall assume and undertake the relevant risks and liabilities.</li>
              <li>Users are responsible for obtaining independent legal advice regarding any Contract prior to sending (as a Sender) or signing (as a Recipient) such Contract. Users are responsible for ensuring (a) that the content of any Contract that a User sends or receives through the Service is accurate, binding, legally enforceable or fit-for-purpose; (b) the sufficiency of the Contract for the transaction between Sender and other Recipients to the Contract; (c) the Contract&rsquo;s compliance with applicable Canadian federal and provincial law; and (d) the appropriateness of using the Service to send, receive or electronically sign such Contract, including the use of electronic signatures as contemplated under applicable Canadian E-Commerce Laws. The Service may not be suitable for use with all Contracts, including those that require secure electronic signatures as defined under PIPEDA and the Secure Electronic Signature Regulations.</li>
              <li>Munal AI Inc does not endorse, support, or guarantee the accuracy, completeness, performance, or legality of any Contract, including, for clarity, that such Contract may be entered through the use of electronic documents or electronic signatures. Munal AI Inc does not make any representations, warranties or guarantees that a Recipient&rsquo;s use of the Service, or their electronic signature made to any Contract, will be valid.</li>
              <li>The Service may only be used to facilitate the delivery and/or execution of Contracts between the parties to those Contracts, and may not be used for, or to facilitate, any unlawful or other impermissible transaction or purpose. Nothing in these Terms or the Service may be construed to make Munal AI Inc or any of its affiliates a party to any Contract.</li>
            </ol>

            {/* USERS */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">USERS</h3>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">1. Senders</h4>
            <p className="text-slate-600 dark:text-slate-300">
              A Sender is a User that may use the Service to upload and send a Contract to one or more designated Recipients, in order to capture such Recipients&rsquo; electronic signatures to the Contract. When using the Service as a Sender, Sender agrees to the following terms:
            </p>

            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Responsibility for Contracts.</p>
                <p>Sender has exclusive control over and sole responsibility for the content, accuracy, quality, enforceability, and format of any Contract, as well as for determining whether the Contract is of a class or type that may be entered into through use of the Service. Munal AI Inc is not responsible for, and has no control over, a Contract&rsquo;s contents. Munal AI Inc does not review, scan or otherwise access the contents of any Contract and does not obtain any right, title or interest in any Contract, including any intellectual property found within it.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Exceptions.</p>
                <p>Certain types of agreements and documents may be excepted from electronic signature laws under Canadian federal or provincial legislation, or may be subject to specific regulations regarding electronic signatures and electronic records. Munal AI Inc is not responsible for determining whether any particular Contract (a) is subject to an exception under applicable Canadian E-Commerce Laws or other provincial legislation; or (b) can be legally formed by electronic signatures or with electronic documents under Canadian law.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Recipients.</p>
                <p>Sender is solely responsible for the accuracy and authenticity of any names and email addresses that it designates as a Recipient to receive a Contract through the Service. Munal AI Inc has no obligation to verify the identity or confirm the accuracy of any Recipient or their name or email address, and has no responsibility or liability to Sender, any Recipient, or other interested party to the Contract, due to your own actions in providing incorrect or inaccurate Recipient information. Munal AI Inc makes no warranty or representation that the name or email address of a Recipient used to sign a Contract actually belongs to the person purported to be bound by the Contract.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Consumer Contracts.</p>
                <p>Certain consumer protection or similar laws or regulations, including the Consumer Protection Act, 2002 (Ontario) and equivalent provincial statutes, may impose special requirements with respect to electronic contracts involving one or more consumers, such as requirements that the consumer consent to electronic contracting. Munal AI Inc is not responsible for: (a) determining whether any particular Contract involves a consumer for the purpose of such laws or regulations; (b) providing any information or disclosures in connection with any Contract involving a consumer; (c) providing legal review of, or update or correct, any information or disclosures currently or previously given to any consumer; or (d) providing the consumer any copies or access to a Contract pursuant to any legal requirements.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Authorized Users.</p>
                <p>Sender may designate one or more Authorized Users to access and use the Service on Sender&rsquo;s behalf, including to upload, deliver or withdraw Contracts, or any other Sender action as permitted under these Terms. Sender shall ensure that its Authorized Users use the Service in accordance with these Terms and shall be responsible for any actions or omissions in connection with the use of the Service by any Authorized Users, including the delivery of Contracts to Recipients through the Service.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Withdrawing a Contract.</p>
                <p>Once a Contract is delivered to its designated Recipient(s), Sender may request the withdrawal of the Contract prior to all designated Recipients signing the Contract. Munal AI Inc will make commercially reasonable efforts to promptly execute the withdrawal request, however, Munal AI Inc does not guarantee that the withdrawal request will be executed, and the Contract withdrawn, before any or all Recipients sign the Contract. After a Contract is signed by all designated Recipients, the Contract may not be withdrawn through the Service.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Indemnification.</p>
                <p>To the extent permitted by applicable law, Sender will defend, indemnify and hold harmless Munal AI Inc and its affiliates against any third-party claim (including claims made by a Recipient) to the extent such claim (a) arises from Sender&rsquo;s use or election to use the Service in connection with a Contract or Sender&rsquo;s breach of these Terms, or (b) alleges that (i) any Contract submitted to or transmitted by the Service misappropriates a trade secret or directly infringes a patent, copyright, trademark, or other proprietary right of a third party; or (ii) Sender&rsquo;s use of the Service, alone or in combination with anything else, violates law or harms a third party, including such third party&rsquo;s intellectual property rights.</p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 pt-2">2. Recipients</h4>
            <p className="text-slate-600 dark:text-slate-300">
              A Recipient is a User that receives a Contract from a Sender through the Service, who may then use the Service to provide an electronic signature to the Contract. When using the Service as a Recipient, Recipient agrees to the following terms:
            </p>

            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Electronic Contracts.</p>
                <p>When Recipient elects to access a Contract through the Service, Recipient acknowledges and agrees that Recipient (a) is accepting the delivery of the Contract, and is able to access and view such Contract, in the electronic form presented by the Service; and (b) has the software and hardware capabilities to open, review and electronically sign the Contract through the Service.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Electronic Signatures.</p>
                <p>Recipient acknowledges and agrees that, should Recipient provide an electronic signature to the Contract, such electronic signature represents (a) a legally binding agreement to the terms of the Contract, (b) Recipient&rsquo;s intent to be bound by such terms, and (c) that Recipient has the legal capacity and authority to electronically sign the Contract. Once a Contract is fully signed by all other Recipients of the Contract, Recipient may not annul, rescind or otherwise void Recipient&rsquo;s signature through the Service.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Declining a Contract.</p>
                <p>If Recipient, or any one of the other Recipients, declines to electronically sign a Contract, then the entire signature process of that document is cancelled to all Users.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Senders.</p>
                <p>Recipient is solely responsible for confirming the identity of the Sender of a Contract, as well as other Recipients associated with the Contract, if any. Munal AI Inc makes no warranty or representation that the name or email address of the Sender or other Recipients associated with a Contract actually belong to the person(s) purported to be the Sender or Recipient (as applicable), or is bound by the Contract.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Disputes.</p>
                <p>If Recipient disputes any aspect of the Contract, Recipient should not sign the Contract and should address such dispute with the Sender directly. Munal AI Inc is not responsible for the formation or content of any Contract or resolving disputes among parties with respect to the Contract.</p>
              </div>
            </div>

            {/* ACCESS AND USE RIGHTS */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">ACCESS AND USE RIGHTS</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-700 dark:text-slate-200">License.</span> The Service is licensed and not sold. Subject to User&rsquo;s compliance with these Terms, Munal AI Inc grants User a nonexclusive, limited and revocable license to use the Service as provided in these Terms. This license is solely for User&rsquo;s own use and business purposes and may not be sub-licensed, assigned or commercially distributed or shared with any third party except as expressly permitted under these Terms.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Reservation of Rights.</span> Munal AI Inc reserves all rights not expressly granted in these Terms. The Service is protected by copyright and other intellectual property laws and international treaties. No rights will be granted or implied by waiver or estoppel.</li>
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">Restrictions.</span> Except as expressly permitted in these Terms or Service documentation, User must not (and is not licensed to):
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>reverse engineer, decompile, or disassemble the Service, or attempt to do so;</li>
                  <li>install or use non-Munal AI software or technology in any way that would subject Munal AI Inc&rsquo;s intellectual property or technology to any other license terms;</li>
                  <li>work around any technical limitations of the Service or restrictions in Service documentation;</li>
                  <li>distribute, sublicense, rent, lease, or lend the Service, in whole or in part, or use them to offer hosting services to a third party.</li>
                </ul>
              </li>
            </ol>

            {/* CONFIDENTIAL INFORMATION */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">CONFIDENTIAL INFORMATION</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Confidential Information.</span> &ldquo;Confidential Information&rdquo; is non-public information that is designated &ldquo;confidential&rdquo; or that a reasonable person should understand is confidential, including, but not limited to, User Data and User&rsquo;s account authentication credentials. &ldquo;User Data&rdquo; means (a) the Contract and its contents (including title, dates and provisions), (b) the parties to the Contract, including Sender and Recipient names and email addresses, and (c) other information provided by User in connection with its use of the Service; and such User Data shall be deemed User&rsquo;s Confidential Information.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Protection of Confidential Information.</span> User and Munal AI Inc will each take reasonable steps to protect the other&rsquo;s Confidential Information and will use the other party&rsquo;s Confidential Information only for purposes of its business relationship. Neither User nor Munal AI Inc will disclose Confidential Information to third parties, except to its employees, affiliates, contractors, advisors, and consultants (&ldquo;Representatives&rdquo;), and then only on a need-to-know basis under nondisclosure obligations at least as protective as these Terms.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Disclosure required by law.</span> User or Munal AI Inc may disclose the other&rsquo;s Confidential Information if required by law, but only to the extent required by such law, and only after it notifies the other party (if legally permissible) to enable the other party to seek a protective order.</li>
            </ol>

            {/* DOCUMENT STORAGE AND DELETION */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">DOCUMENT STORAGE AND DELETION</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Document Retention.</span> Munal AI Inc is not responsible for determining how long any Contract is required to be retained or stored under any applicable laws, regulations, or legal or administrative agency processes. User is solely responsible for ensuring that it retains a copy of the Contract for any legally required record retention period, and in such form or format as may be required under applicable law.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Availability of Contracts.</span> A Contract will remain available for review and signature until Sender withdraws the Contract, any Recipient declines to electronically sign the Contract, or all Recipients electronically sign the Contract. After a Contract is signed by all Recipients, the Contract will be available to each Recipient for 30 days from the date that Recipients are notified that the Contract has been signed. Each Recipient is responsible for downloading, saving or otherwise retaining a copy of a Contract for its own records. Signed contracts will remain available to Sender through the Munal AI platform in accordance with Sender&rsquo;s agreement with Munal AI Inc and Sender&rsquo;s own document retention configuration.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Deletion.</span> Munal AI Inc reserves the right to suspend access to or delete any Contract if Munal AI Inc reasonably and in good faith suspects or believes that such Contract is for illegal purposes or otherwise could cause any User to be in violation of these Terms. Munal AI Inc will make commercially reasonable efforts to notify Sender prior to such suspension or deletion, unless Munal AI Inc reasonably believes that: (a) it is prohibited from doing so under applicable law or under legal process; or (b) it is necessary to delay notice in order to prevent imminent harm to the Service, Munal AI Inc or its affiliates, or a third party.</li>
            </ol>

            {/* WARRANTY AND DISCLAIMERS */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">WARRANTY AND DISCLAIMERS</h3>

            <p className="text-slate-600 dark:text-slate-300">
              Munal AI Inc warrants that its service will function substantially as described in these Terms. Otherwise and to the extent permitted under applicable law:
            </p>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li>Munal AI Inc disclaims all express, implied, or statutory warranties and conditions, including warranties and conditions of quality, title, non-infringement, merchantability, and fitness for a particular purpose regarding the Service.</li>
              <li>The Service is provided without charge &ldquo;AS IS,&rdquo; without any warranty or condition. Munal AI Inc makes no warranty or representation as to the quality, safety or fitness for purpose of the Service, or of any Contract (whether delivered, made available or electronically signed through the Service), nor does Munal AI Inc warrant that the operation or use of the Service will be error-free, virus-free or uninterrupted.</li>
              <li>Munal AI Inc takes no responsibility and is not liable for any harm or loss suffered by User as a result of sending or signing a Contract, or relying on information contained in a Contract. If User suffers any loss or harm as a result of signing a Contract, or not signing a Contract, User agrees that it shall have no recourse or claim against Munal AI Inc.</li>
            </ol>

            {/* PRIVACY & SECURITY */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">PRIVACY &amp; SECURITY</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Data Protection and Processing.</span> Munal AI Inc, and its respective agents and subcontractors, will process User Data as provided in these Terms and the Data Protection Addendum (DPA), which is incorporated by reference, in compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation, including the Consumer Privacy Protection Act (CPPA) upon its coming into force. Before providing any User Data to Munal AI Inc, User will obtain all required consents from third parties (including Recipients) under applicable Canadian federal and provincial privacy and data protection laws.</li>
              <li>In addition to these Terms, User acknowledges and agrees to the terms of the Munal AI Privacy Statement, which describes the types of User Data Munal AI Inc collects from User and User&rsquo;s devices, how Munal AI Inc uses User Data, and the legal bases Munal AI Inc has to process User Data in accordance with PIPEDA and applicable Canadian law.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Your Privacy Obligations.</span> Munal AI Inc makes no warranty as to the suitability of the Service in regard to User&rsquo;s own privacy obligations with respect to other parties to a Contract. User is solely responsible for its own collection, use and disclosure of information concerning itself and other parties. By using the Service, User represents and warrants that it has obtained all necessary authorizations, consents and permissions to provide information to Munal AI Inc in connection with the Service.</li>
            </ol>

            {/* SUSPENSION & TERMINATION */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">SUSPENSION &amp; TERMINATION</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li>The Service may set and enforce limits for reasonable use in order to prevent abusive or unduly burdensome use of the Service. Munal AI Inc may further suspend (in whole or in part) User&rsquo;s, and any Authorized User&rsquo;s, access and use of the Service, or disable any aspect of the Service, if Munal AI Inc reasonably and in good faith believes that such access or use violates these Terms.</li>
              <li>Munal AI Inc may terminate User&rsquo;s use of the Service, or the Service generally, at any time in its sole discretion. Munal AI Inc will make commercially reasonable efforts to notify User prior to any such termination. Upon any termination of User&rsquo;s access to the Service, these Terms, including User&rsquo;s license rights, shall immediately terminate and User must promptly stop using the Service.</li>
            </ol>

            {/* LIMITATION OF LIABILITY */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">LIMITATION OF LIABILITY</h3>

            <p className="text-slate-600 dark:text-slate-300">To the extent permitted by applicable law:</p>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li>In no event will Munal AI Inc be liable for direct, indirect, incidental, special, punitive, or consequential damages; loss of revenue, profits, or anticipated savings; or loss of use, loss of business information, or interruption of business, however caused or on any theory of liability, in connection with the Service.</li>
              <li>No limitation or exclusions under these Terms will apply to liability arising out of either User&rsquo;s or Munal AI Inc&rsquo;s (a) confidentiality obligations; (b) indemnification obligations; or (c) violation of the other party&rsquo;s intellectual property rights.</li>
              <li>The limitations, exclusions, and exceptions set forth in this section apply to all claims and damages under or relating to these Terms or the Service, including breach of contract, breach of warranty, strict liability, and negligence and other torts.</li>
              <li>Without limiting any of the foregoing, should Munal AI Inc be deemed liable to User, its liability shall be limited to reperformance of the Service or refund of any fee paid for use of the Service from which such liability arose.</li>
            </ol>

            {/* DISPUTE RESOLUTION */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">DISPUTE RESOLUTION</h3>

            <p className="text-slate-600 dark:text-slate-300">
              Except as otherwise required by applicable law, any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be resolved by the courts of the Province of Ontario, Canada. User and Munal AI Inc each irrevocably attorn to the exclusive jurisdiction of the courts of the Province of Ontario and the Federal Court of Canada, as applicable, sitting in Toronto, Ontario. This choice of venue does not prevent either User or Munal AI Inc from seeking injunctive relief in any jurisdiction with respect to a violation of intellectual property rights or confidentiality obligations.
            </p>

            {/* MISCELLANEOUS */}
            <h3 className="text-base font-bold text-slate-800 dark:text-white pt-2">MISCELLANEOUS</h3>

            <ol className="list-decimal pl-5 space-y-3 text-slate-600 dark:text-slate-300">
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Modifications.</span> Munal AI Inc may update these Terms from time to time. Changes will apply when they are published on the Service site or made available to Recipients through notice. User accepts revised or additional terms when using the Service. If a User does not agree to changes to these Terms, User must stop using the Service.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Independent Contractors.</span> User and Munal AI Inc are independent contractors. User and Munal AI Inc each may develop products independently without using the other&rsquo;s Confidential Information.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Assignment.</span> Munal AI Inc may assign these Terms to an affiliate. User consents to such assignment to an affiliate or third party, without prior notice, of any rights Munal AI Inc may have under these Terms. Any attempted assignment by User, without Munal AI Inc&rsquo;s prior written approval, will be void.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Severability.</span> If any part of these Terms are held to be unenforceable, the rest of these Terms will remain in full force and effect.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Waiver.</span> Failure to enforce any provision of these Terms will not constitute a waiver. Any waiver must be in writing and signed by the waiving party.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">No Third-Party Beneficiaries.</span> These Terms do not create any third-party beneficiary rights except as expressly provided by its terms.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Survival.</span> All provisions survive termination of these Terms except those requiring performance only during the term of these Terms.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Notices.</span> Munal AI Inc may provide User with information and notices electronically, including by email, through the portal for the Service, or by other electronic means. Notice is given as of the date it is made available by Munal AI Inc.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Applicable Law.</span> These Terms will be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles. The 1980 United Nations Convention on Contracts for the International Sale of Goods and its related instruments will not apply to these Terms.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Affiliates and Subcontractors.</span> Munal AI Inc may perform its obligations under these Terms through its affiliates and use subcontractors to provide certain services. Munal AI Inc remains responsible for their performance.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Government Procurement Rules.</span> If User is a Canadian federal, provincial, or municipal government entity or is otherwise subject to government procurement requirements, User represents and warrants that (a) it has complied and will comply with all applicable government procurement laws and regulations, including the Canadian Free Trade Agreement (CFTA) and applicable trade agreements; (b) it is authorized to enter into these Terms; and (c) these Terms satisfy all applicable procurement requirements.</li>
              <li><span className="font-medium text-slate-700 dark:text-slate-200">Compliance with Trade Laws.</span> The Service may be subject to Canadian, U.S., and other countries&rsquo; export jurisdictions, including the Export and Import Permits Act (Canada), the Special Economic Measures Act (Canada), and applicable international trade sanctions. User and Munal AI Inc each will comply with all laws and regulations applicable to the import or export of the Service. User will not take any action that causes Munal AI Inc to violate applicable Trade Laws. Munal AI Inc may suspend or terminate these Terms to the extent that Munal AI Inc reasonably believes that performance would cause it to violate Trade Laws or put it at risk of becoming subject to sanctions and penalties under such laws.</li>
            </ol>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Munal AI eSignature &mdash; Powered by Munal AI &bull; Last updated: April 4, 2026
              </p>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ESignatureTermsOfService;
