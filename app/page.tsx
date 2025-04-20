import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { db } from '@/lib/db';
import { campaignCategories } from '@/lib/validations';
import { CreateCampaignButton } from '@/components/create-campaign-button';
import { isYouTubeUrl } from '@/lib/utils';
import { YouTubeEmbed } from '@/components/youtube-embed';

export const dynamic = 'force-dynamic';

interface Campaign {
  id: string;
  title: string;
  summary: string;
  description: string;
  goal_amount: number;
  slug: string;
  end_date: string;
  category: string;
  image_url: string | null;
  wallet_address: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  donation_count: number;
  total_raised: number;
}

async function getFeaturedCampaigns(): Promise<Campaign[]> {
  try {
    const results = await db.execute({
      sql: `
        SELECT c.*, COUNT(d.id) as donation_count, COALESCE(SUM(d.amount), 0) as total_raised
        FROM campaigns c
        LEFT JOIN donations d ON c.id = d.campaign_id
        GROUP BY c.id 
        ORDER BY c.created_at DESC 
        LIMIT 3
      `,
    });
    // Convert numeric values from string to number
    return results.rows.map((row) => {
      const campaign = row as unknown as Campaign;
      campaign.goal_amount = Number(campaign.goal_amount);
      campaign.total_raised = Number(campaign.total_raised);
      campaign.donation_count = Number(campaign.donation_count);
      return campaign;
    });
  } catch (error) {
    console.error('Error fetching featured campaigns:', error);
    return [];
  }
}

const faqs = [
  {
    question: "How can I make a donation?",
    answer: "Making a donation with FundSol is simple and fast! First, connect your Solana wallet using the \"Connect Wallet\" button in the navigation bar. Then, browse campaigns and click on one you'd like to support. Enter the amount you wish to donate in SOL, confirm the transaction in your wallet, and you're done! Your donation is processed instantly on the Solana blockchain with minimal fees."
  },
  {
    question: "How do I create my own fundraising campaign?",
    answer: "Creating a campaign on FundSol takes just a few minutes. First, connect your Solana wallet. Then click the \"Start Fundraising\" button and fill out the campaign details: title, description, fundraising goal, end date, and optional image. Choose a category that best represents your cause, and create a unique URL for your campaign. Once submitted, your campaign will be live immediately, and you can share it with your network to start collecting donations."
  },
  {
    question: "What is Solana and why does FundSol use it?",
    answer: "Solana is a high-performance blockchain that enables fast, secure, and low-cost transactions. FundSol utilizes Solana because it offers several advantages for fundraising: nearly instant transaction confirmation (under 1 second), extremely low fees (typically less than $0.01 per transaction), and high scalability. This means more of your donation goes directly to the cause rather than being lost to processing fees, and campaign organizers receive funds almost immediately."
  },
  {
    question: "How secure are donations on FundSol?",
    answer: "FundSol leverages blockchain technology to provide enhanced security for all donations. Each transaction is cryptographically secured and permanently recorded on the Solana blockchain, making it tamper-proof and transparent. Donors maintain control of their funds until the moment of donation through their own personal wallets, eliminating the risk of platform hacks that could compromise financial information. Additionally, the decentralized nature of blockchain technology means there's no single point of failure in the donation process."
  },
  {
    question: "Do I need technical knowledge to use FundSol?",
    answer: "No technical knowledge is required! While FundSol uses advanced blockchain technology behind the scenes, we've designed the platform to be user-friendly and accessible to everyone. The only requirement is having a Solana wallet (like Phantom or Solflare), which takes just minutes to set up with no technical expertise needed. Our interface is intuitive, making it easy to create campaigns or donate with just a few clicks, regardless of your familiarity with blockchain technology."
  }
];

export default async function Home() {
  const featuredCampaigns = await getFeaturedCampaigns();

  return (
    <div className="min-h-screen flex flex-col">
      <section className="relative bg-[#fefdf9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-15">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8 max-w-2xl mx-auto lg:mx-0">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#083531] leading-tight">
                  Raise funds for the people and causes you care about
                </h1>
                <p className="text-lg text-[#083531]/50 mt-6 subheading">
                  With FundSol, you can easily create a campaign and start raising money for what matters to you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/create" 
                  className="inline-flex justify-center items-center text-lg px-8 py-4 bg-[#20694c] hover:bg-[#185339] text-white font-medium rounded-md transition-colors"
                >
                  Start a fundraiser
                </Link>
                <Link 
                  href="/campaigns" 
                  className="inline-flex justify-center items-center text-lg text-[#083531] hover:text-[#20694c] font-medium transition-colors"
                >
                  Browse fundraisers
                </Link>
              </div>
            </div>
            <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-lg hidden lg:block">
        <Image
                src="/fundsol1.png" 
                alt="Hands reaching to help" 
                fill 
                className="object-cover"
          priority
        />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Overlaid Stats */}
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-2 bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#083531]">400ms</p>
                  <p className="text-xs text-[#083531]/50">Transaction Speed</p>
                </div>
                <div className="text-center border-x border-gray-200 dark:border-gray-700">
                  <p className="text-2xl font-bold text-[#083531]">$0.0025</p>
                  <p className="text-xs text-[#083531]/50">Average Fee</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#083531]">65K+</p>
                  <p className="text-xs text-[#083531]/50">TPS Capacity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#083531]">
                A secure, transparent fundraising platform
              </h2>
              <p className="text-[#083531]/70 mb-8">
                FundSol leverages the power of Solana blockchain technology to ensure every donation is securely recorded and transparently tracked. Your donors can verify their contributions on-chain, building trust and accountability.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#20694c]/10 flex items-center justify-center mr-3 mt-1">
                    <div className="h-3 w-3 rounded-full bg-[#20694c]"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 text-[#083531]">Near-Zero Transaction Fees</h3>
                    <p className="text-[#083531]/70">
                      Solana&apos;s low-cost transactions mean more of your donors&apos; money goes directly to your cause.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#20694c]/10 flex items-center justify-center mr-3 mt-1">
                    <div className="h-3 w-3 rounded-full bg-[#20694c]"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 text-[#083531]">Lightning-Fast Settlements</h3>
                    <p className="text-[#083531]/70">
                      Donations are processed in milliseconds, allowing immediate access to funds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#20694c]/10 flex items-center justify-center mr-3 mt-1">
                    <div className="h-3 w-3 rounded-full bg-[#20694c]"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1 text-[#083531]">Open & Verifiable</h3>
                    <p className="text-[#083531]/70">
                      All donations and campaign statistics are recorded on the public blockchain for complete transparency.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md h-[400px] rounded-lg overflow-hidden shadow-xl">
            <Image
                  src="/soldonate.png"
                  alt="Global Fundraising Network"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fund, Fast As Flash */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#083531]">Fund, Fast As <span className="italic text-[#20694c]">Flash</span></h2>
            <p className="text-[#083531]/50 max-w-2xl mx-auto subheading">
              Fundraise at the speed of thought! Elevate your cause in just a minute with our lightning-fast fundraising platform.
            </p>
          </div>

          {/* Three Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100">
              <div className="w-16 h-16 bg-[#20694c]/10 rounded-lg flex items-center justify-center mb-6 mx-auto md:mx-0">
                <span className="text-2xl">🔥</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 md:text-left text-center text-[#083531]">Ignite Impact</h3>
              <p className="text-[#083531]/70 md:text-left text-center">
                Thank you for sharing your cause and the positive impact it brings. Caring supporters help make a meaningful difference.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100">
              <div className="w-16 h-16 bg-[#20694c]/10 rounded-lg flex items-center justify-center mb-6 mx-auto md:mx-0">
                <span className="text-2xl">📣</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 md:text-left text-center text-[#083531]">Spread The Word</h3>
              <p className="text-[#083531]/70 md:text-left text-center">
                Leverage the speed of social media and online networks. Share your fundraising campaign easily across various platforms.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100">
              <div className="w-16 h-16 bg-[#20694c]/10 rounded-lg flex items-center justify-center mb-6 mx-auto md:mx-0">
                <span className="text-2xl">🌎</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 md:text-left text-center text-[#083531]">Connect Globally</h3>
              <p className="text-[#083531]/70 md:text-left text-center">
                Build a strong social network around your cause. Encourage supporters to share the campaign within their local communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Campaigns */}
      <section className="py-20 bg-[#fefdf9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#083531]">Live Campaigns</h2>
            <p className="text-[#083531]/50 max-w-2xl mx-auto subheading">
              Discover and support these active campaigns making a real difference right now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCampaigns.length > 0 ? (
              featuredCampaigns.map((campaign) => {
                const endDate = new Date(campaign.end_date);
                const isEnded = endDate < new Date();
                const progress = campaign.goal_amount > 0 
                  ? Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100) 
                  : 0;
                  
                // Find category label
                const categoryObj = campaignCategories.find(c => c.value === campaign.category);
                const categoryLabel = categoryObj ? categoryObj.label : campaign.category;
                
                const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                  
                return (
                  <Link href={`/campaigns/${campaign.slug}`} key={campaign.id}>
                    <div className="border border-gray-100 overflow-hidden bg-white h-full transition-all hover:shadow-md rounded-lg">
                      <div className="h-[220px] relative">
                        {campaign.image_url ? (
                          isYouTubeUrl(campaign.image_url) ? (
                            <YouTubeEmbed 
                              url={campaign.image_url} 
                              title={campaign.title}
                              className="w-full h-full"
                            />
                          ) : (
                            <img 
                              src={campaign.image_url} 
                              alt={campaign.title} 
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
          <Image
                            src="/images/placeholder-campaign.jpg" 
                            alt="Campaign placeholder" 
                            fill 
                            className="object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-white/90 backdrop-blur-sm text-[#083531]">
                            {categoryLabel}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-medium line-clamp-1 text-[#083531]">{campaign.title}</h3>
                        
                        {campaign.summary && (
                          <p className="text-xs text-[#083531]/60 mt-1 mb-2 line-clamp-2">
                            {campaign.summary}
                          </p>
                        )}
                        
                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-gray-100 my-3 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#20694c]" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs mt-2">
                          <div>
                            <span className="font-semibold text-[#083531]">{progress}%</span>
                            <span className="text-[#083531]/60 ml-1">funded</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#083531]">{campaign.total_raised.toFixed(2)} SOL</span>
                            <span className="text-[#083531]/60 ml-1">raised</span>
                          </div>
                          <div>
                            {isEnded ? (
                              <span className="text-[#083531]/60">Campaign ended</span>
                            ) : (
                              <>
                                <span className="font-semibold text-[#083531]">{daysLeft}</span>
                                <span className="text-[#083531]/60 ml-1">{daysLeft === 1 ? 'day' : 'days'} left</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-[#083531]/60 mb-6">No campaigns found. Be the first to create one!</p>
                <Link 
                  href="/create" 
                  className="inline-flex justify-center items-center px-6 py-3 bg-[#20694c] hover:bg-[#185339] text-white font-medium rounded-md transition-colors"
                >
                  Create Campaign
                </Link>
              </div>
            )}
          </div>

          {featuredCampaigns.length > 0 && (
            <div className="mt-12 text-center">
              <Link 
                href="/campaigns" 
                className="inline-flex justify-center items-center px-6 py-3 bg-[#20694c] hover:bg-[#185339] text-white font-medium rounded-md transition-colors"
              >
                View All Campaigns
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-br from-[#20694c] to-[#083531] text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#b5f265]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#b5f265]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#b5f265]/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#b5f265]/10 rounded-full blur-2xl"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="relative mb-16 max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-5 text-[#20694c] text-sm font-semibold bg-[#b5f265] rounded-full shadow-lg">Built for Impact</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
              Why Fundraise on <span className="relative inline-block">
                <span className="text-[#b5f265]">FundSol</span>
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-[#b5f265] rounded-full"></span>
              </span>?
            </h2>
            <p className="text-xl md:text-2xl font-light text-white/90 leading-relaxed relative">
              <span className="absolute -left-6 -top-3 text-6xl text-[#b5f265]/20">&quot;</span>
              Our Solana-powered platform makes fundraising 
              <span className="mx-1 px-2 py-0.5 bg-[#b5f265] text-[#20694c] font-semibold rounded">faster</span>, 
              <span className="mx-1 px-2 py-0.5 bg-[#b5f265] text-[#20694c] font-semibold rounded">cheaper</span>, and 
              <span className="mx-1 px-2 py-0.5 bg-[#b5f265] text-[#20694c] font-semibold rounded">more transparent</span> 
              than ever before.
              <span className="absolute -right-6 -bottom-5 text-6xl text-[#b5f265]/20">&quot;</span>
            </p>
          </div>
          <div className="pt-8 max-w-lg mx-auto">
            <CreateCampaignButton className="text-lg px-10 py-6 bg-black hover:bg-gray-900 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              Start Your Campaign Today →
            </CreateCampaignButton>
            <p className="mt-4 text-sm text-white/70">No technical knowledge required. Get started in under 3 minutes.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          
          {/* Map through FAQ items from a data array */}
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 p-6 transition-all">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                    <h3 className="text-xl font-medium">{faq.question}</h3>
                    <div className="transition group-open:rotate-180">
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500" />
                    </div>
                  </summary>
                  <div className="mt-4 text-gray-600 dark:text-gray-300">
                    <p>{faq.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#083531]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to make a difference?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Join thousands of changemakers using FundSol to fund projects, support causes, and build communities.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/create" 
              className="inline-flex justify-center items-center px-8 py-4 bg-white hover:bg-gray-100 text-[#083531] font-medium rounded-md transition-colors"
            >
              Start a fundraiser
            </Link>
            <Link 
              href="/campaigns" 
              className="inline-flex justify-center items-center px-8 py-4 border border-white/30 hover:bg-white/10 text-white font-medium rounded-md transition-colors"
            >
              Explore campaigns
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}