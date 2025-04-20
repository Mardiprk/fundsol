import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | FundSol",
  description: "Read FundSol's privacy policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg mb-8">
          Last Updated: May 24, 2023
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            At FundSol, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fundraising platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
          <p className="mb-4">
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Create an account or profile</li>
            <li>Create or donate to a fundraising campaign</li>
            <li>Contact our support team</li>
            <li>Subscribe to our newsletter</li>
            <li>Respond to surveys or promotions</li>
          </ul>
          <p className="mb-4">
            The personal information we may collect includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your name and contact information</li>
            <li>Your Solana wallet address</li>
            <li>Payment information (processed securely through blockchain technology)</li>
            <li>Content you share when creating campaigns or posting updates</li>
          </ul>
          
          <h3 className="text-xl font-semibold mb-2">Automatically Collected Information</h3>
          <p className="mb-4">
            When you access our platform, we may automatically collect certain information, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Device information (type of device, operating system, browser)</li>
            <li>Log data (IP address, access times, pages viewed)</li>
            <li>Location information (general location based on IP address)</li>
            <li>Usage patterns and preferences</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">
            We use your information for various purposes, including to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Facilitate and process donations and campaign creation</li>
            <li>Verify your identity and prevent fraud</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Send you updates about campaigns you support or have created</li>
            <li>Improve our platform and develop new features</li>
            <li>Comply with legal obligations</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Send administrative information, such as updates to our terms and policies</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Blockchain Transparency</h2>
          <p className="mb-4">
            As a blockchain-based platform, transactions on FundSol are recorded on the Solana blockchain. This means:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Wallet addresses, transaction amounts, and timestamps are publicly visible on the blockchain</li>
            <li>Transaction data cannot be deleted or modified once recorded on the blockchain</li>
            <li>Your personal identity is not directly linked to your wallet address unless you choose to make that connection elsewhere</li>
          </ul>
          <p>
            When using our services, you acknowledge and accept the inherent transparency of blockchain technology.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to collect information about your browsing activities. These technologies help us analyze usage patterns, remember your preferences, and improve your experience.
          </p>
          <p className="mb-4">
            You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Information Sharing and Disclosure</h2>
          <p className="mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Campaign Organizers:</strong> When you donate to a campaign, the organizer may receive your name, email address, and donation amount to facilitate acknowledgment and communication.</li>
            <li><strong>Service Providers:</strong> Third-party vendors who help us provide and improve our services (e.g., hosting, analytics, customer support).</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, or legal process.</li>
            <li><strong>Business Transfers:</strong> If FundSol is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          </ul>
          <p>
            We do not sell your personal information to third parties for marketing purposes.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
          </p>
          <p>
            To maximize security, we recommend using strong passwords for your wallet and accounts, enabling two-factor authentication where available, and keeping your private keys and seed phrases secure.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Your Privacy Rights</h2>
          <p className="mb-4">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Accessing and receiving a copy of your data</li>
            <li>Correcting inaccurate personal information</li>
            <li>Requesting deletion of your personal information</li>
            <li>Objecting to or restricting certain processing activities</li>
            <li>Data portability (receiving your data in a structured, machine-readable format)</li>
            <li>Withdrawing consent for processing based on consent</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, please contact us using the information provided below. Note that some data, such as blockchain transactions, cannot be modified or deleted due to the nature of blockchain technology.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
          <p>
            FundSol operates globally, which means your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our services, you consent to the transfer of your information to countries outside your country of residence, including the United States, where our primary servers are located.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected personal information from a child under 18, we will take steps to delete that information as quickly as possible. If you believe a child has provided us with personal information, please contact us.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page and updating the &quot;Last Updated&quot; date. We encourage you to review this policy periodically to stay informed about how we collect, use, and protect your information.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this privacy policy or our data practices, please contact us at:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> privacy@fundsol.com<br />
            <strong>Address:</strong> FundSol Inc., 123 Blockchain Way, Suite 200, San Francisco, CA 94104
          </p>
        </section>
      </div>
      
      <div className="mt-12 text-center">
        <Link 
          href="/" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 