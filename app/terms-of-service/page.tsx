import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | FundSol",
  description: "Terms and conditions for using the FundSol crowdfunding platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last Updated: July 16, 2023
          </p>
        </div>

        <div className="prose max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-primary">
          <section className="mb-8">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the FundSol platform, including our website, services, and applications (collectively, the &quot;Services&quot;). Please read these Terms carefully before using our Services. By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Using FundSol</h2>
            
            <h3 className="text-xl font-medium my-3">1.1 Eligibility</h3>
            <p>
              You must be at least 18 years old to use our Services. By using FundSol, you represent and warrant that you have the legal capacity to enter into these Terms. If you are using the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
            
            <h3 className="text-xl font-medium my-3">1.2 Account Creation</h3>
            <p>
              To use certain features of the Services, you must connect a compatible Solana wallet. You are responsible for maintaining the security of your wallet and any activities that occur through your account. FundSol is not responsible for any loss or damage arising from your failure to maintain the security of your wallet or account.
            </p>
            
            <h3 className="text-xl font-medium my-3">1.3 Prohibited Activities</h3>
            <p>
              When using our Services, you agree not to:
            </p>
            <ul className="list-disc pl-6 my-3 text-gray-600 dark:text-gray-300">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Use the Services for illegal purposes or to promote illegal activities</li>
              <li>Post or transmit content that is fraudulent, false, misleading, or deceptive</li>
              <li>Attempt to circumvent any security measures of the Services</li>
              <li>Use the Services to distribute malware or other harmful code</li>
              <li>Engage in any activity that interferes with or disrupts the Services</li>
              <li>Create or fund campaigns for illegal or prohibited purposes</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              <li>Collect or store personal data about other users without their consent</li>
              <li>Use the Services in a manner that could disable, overburden, or impair the proper function of the Services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Campaigns and Donations</h2>
            
            <h3 className="text-xl font-medium my-3">2.1 Campaign Creation</h3>
            <p>
              When you create a campaign on FundSol, you are responsible for fulfilling any promises, commitments, or goals associated with your campaign. You agree to provide accurate information about your campaign, including its purpose, funding goals, and intended use of funds.
            </p>
            
            <h3 className="text-xl font-medium my-3">2.2 Campaign Content</h3>
            <p>
              You retain ownership of all content you create and post on FundSol. However, by posting content, you grant FundSol a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content for the purpose of operating and promoting the Services.
            </p>
            <p className="mt-3">
              You are solely responsible for the content of your campaign. FundSol does not endorse or verify the accuracy of any campaign content. You agree not to post content that:
            </p>
            <ul className="list-disc pl-6 my-3 text-gray-600 dark:text-gray-300">
              <li>Infringes upon the intellectual property rights of any third party</li>
              <li>Contains false, defamatory, misleading, or deceptive statements</li>
              <li>Violates any applicable laws or regulations</li>
              <li>Contains hate speech, discrimination, or offensive content</li>
              <li>Promotes violence, terrorism, or illegal activities</li>
            </ul>
            
            <h3 className="text-xl font-medium my-3">2.3 Donations</h3>
            <p>
              By donating to a campaign, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 my-3 text-gray-600 dark:text-gray-300">
              <li>Donations are made at your own risk and discretion</li>
              <li>FundSol does not guarantee that campaigns will use funds as promised</li>
              <li>Blockchain transactions are irreversible, and refunds may not be possible</li>
              <li>All donations are recorded on the Solana blockchain and are subject to network fees</li>
              <li>FundSol takes a platform fee from each donation as described in our fee structure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Intellectual Property</h2>
            <p>
              The FundSol platform, including its logo, design, text, graphics, interfaces, and code, is owned by or licensed to FundSol and is protected by copyright, trademark, and other intellectual property laws. You may not use, reproduce, distribute, modify, or create derivative works from any part of the Services without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-medium my-3">4.1 Disclaimers</h3>
            <p>
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, FUNDSOL DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              FUNDSOL DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED. FUNDSOL DOES NOT MAKE ANY REPRESENTATIONS OR WARRANTIES ABOUT THE ACCURACY, RELIABILITY, COMPLETENESS, OR TIMELINESS OF THE CONTENT PROVIDED THROUGH THE SERVICES.
            </p>
            <p className="mt-3">
              FUNDSOL IS NOT RESPONSIBLE FOR VERIFYING THE IDENTITY OF CAMPAIGN CREATORS OR THE ACCURACY OF CAMPAIGN DESCRIPTIONS. FUNDSOL DOES NOT GUARANTEE THAT CAMPAIGNS WILL USE DONATED FUNDS AS PROMISED OR ACHIEVE THEIR STATED GOALS.
            </p>
            
            <h3 className="text-xl font-medium my-3">4.2 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FUNDSOL AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="mt-3">
              IN NO EVENT SHALL FUNDSOL&apos;S TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICES EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICES OR $100, WHICHEVER IS GREATER.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Blockchain and Cryptocurrency Risks</h2>
            <p>
              By using FundSol, you acknowledge and accept the inherent risks associated with blockchain technology and cryptocurrencies, including:
            </p>
            <ul className="list-disc pl-6 my-3 text-gray-600 dark:text-gray-300">
              <li>Volatility in the value of cryptocurrencies</li>
              <li>Technical vulnerabilities in blockchain protocols</li>
              <li>Network congestion and increased transaction fees</li>
              <li>Loss of access to your wallet due to forgotten passwords or private keys</li>
              <li>Regulatory changes that may affect the use of cryptocurrencies</li>
              <li>Smart contract vulnerabilities or bugs</li>
            </ul>
            <p className="mt-3">
              FundSol is not responsible for any losses or damages resulting from these risks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless FundSol and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney&apos;s fees) arising from: (i) your use of and access to the Services; (ii) your violation of any term of these Terms; (iii) your violation of any third-party right, including without limitation any copyright, property, or privacy right; or (iv) any claim that your content caused damage to a third party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Modifications to the Terms and Services</h2>
            <p>
              FundSol reserves the right to modify or replace these Terms at any time. We will provide notice of any significant changes by posting the new Terms on our website. Your continued use of the Services after any such changes constitutes your acceptance of the new Terms.
            </p>
            <p className="mt-3">
              FundSol may also modify, suspend, or discontinue any part of the Services at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
            </p>
            <p className="mt-3">
              Any dispute arising from or relating to these Terms or the Services shall be resolved through binding arbitration conducted in accordance with the rules of the [Arbitration Association] in [Jurisdiction]. The arbitration shall be conducted in English, and the arbitrator&apos;s decision shall be binding and final.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p>
              FundSol may terminate or suspend your access to the Services immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Services will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <address className="mt-3 not-italic text-gray-600 dark:text-gray-300">
              <p>Email: legal@fundsol.com</p>
              <p>Address: 123 Blockchain Avenue, Suite 101, Crypto City, CS 12345</p>
            </address>
          </section>
        </div>

        <div className="mt-12 border-t pt-8 dark:border-gray-800">
          <Link href="/" className="flex items-center text-primary hover:text-primary/80 transition-colors">
            <span>Return to Home</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
} 