import { useState } from 'react';
import { Menu, Copy, Check, Mail, ExternalLink, FileText, Image as ImageIcon, Clock, AlertTriangle, Gavel, BookOpen, Users, Filter, Shield, HelpCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import './App.css';

// Source code for "See Code" feature
const sourceCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buckler Family Justice Campaign</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-stone-50 text-stone-900">
    <!-- This is the Buckler Family Justice Campaign website -->
    <!-- Built to document historical land injustice and mobilize public support -->
    <!-- For justice, compensation, and recognition for the Buckler family -->
</body>
</html>`;

// Timeline data with evidence categories
// Categories: 'irrefutable' = court documents, newspaper archives, official records
//             'general' = commonly accepted historical facts, family testimony
//             'unsubstantiated' = claims without documented evidence

type EvidenceCategory = 'irrefutable' | 'general' | 'unsubstantiated';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  category: EvidenceCategory;
  sources?: string[];
}

const timeline: TimelineEvent[] = [
  { 
    year: '525 AD', 
    title: 'Celtic Monastery Founded', 
    description: 'Religious community established at Llandough. The site becomes one of the major early-medieval monasteries of Glamorgan.',
    category: 'general',
    sources: ['Archaeological excavation report, Cotswold Archaeology 1994']
  },
  { 
    year: '2nd Century', 
    title: 'Roman Villa Constructed', 
    description: 'Substantial Roman villa built with hypocaust system, bath complex, and extensive grounds.',
    category: 'irrefutable',
    sources: ['Archaeological excavation report, GGAT 1979', 'Cotswold Archaeology 1994']
  },
  { 
    year: '11th Century', 
    title: 'Tewkesbury Abbey Grange', 
    description: 'Llandough granted to Tewkesbury Abbey. A grange is established on the site of Great House Farm.',
    category: 'general',
    sources: ['Historical records, Tewkesbury Abbey archives']
  },
  { 
    year: '1657', 
    title: 'Williams Family Occupation Begins', 
    description: 'The Williams family (Buckler ancestors) first occupy Great House Farm. Continuous occupation for over 400 years begins.',
    category: 'general',
    sources: ['Family records', '1915 court case documentation']
  },
  { 
    year: '1897', 
    title: 'Marconi at Great House Farm', 
    description: 'Guglielmo Marconi stays at the farm while conducting his first radio transmission experiments over open sea from Lavernock Point.',
    category: 'unsubstantiated',
    sources: ['Family oral history', 'Blog: The Great House Farm Story']
  },
  { 
    year: '1915', 
    title: 'First Legal Challenge', 
    description: 'Bute Estates attempt to evict the Williams family. The family successfully proves their equitable title and the case is dropped.',
    category: 'general',
    sources: ['Family records', 'Legal documentation']
  },
  { 
    year: '1950s', 
    title: 'Theft of Deeds', 
    description: 'Land deeds are stolen from the farm by an itinerant worker encouraged by the estate agent. Index card goes missing from Cardiff Library in 1984.',
    category: 'general',
    sources: ['Family testimony', 'Blog: The Great House Farm Story']
  },
  { 
    year: '1955', 
    title: 'Water Supply Cut Off', 
    description: 'Western Ground Rents persuade Cardiff Corporation to deny the farm water. Dairy herd depleted, family forced to seek water from River Ely.',
    category: 'general',
    sources: ['Family testimony', 'Parliamentary questions record']
  },
  { 
    year: '1969', 
    title: 'BP Acquires the Land', 
    description: 'Great House Farm sold by Western Ground Rents to BP Pension Trust Ltd.',
    category: 'irrefutable',
    sources: ['BP Properties Ltd v Buckler [1987] EWCA Civ 2 court records']
  },
  { 
    year: '1974', 
    title: 'Possession Action Begins', 
    description: 'BP Pension Trust starts legal action. 1,700 people sign petition to save the farm. Mary Williams responds to license offer: "It\'s my land. It\'s not your permission to give."',
    category: 'irrefutable',
    sources: ['South Wales Echo 1974', 'Court records']
  },
  { 
    year: '1983', 
    title: 'Mary Williams Dies', 
    description: 'Mary Williams Buckler dies, still maintaining "It\'s my land." Her son William continues the fight.',
    category: 'general',
    sources: ['Family records']
  },
  { 
    year: '1987', 
    title: 'Court of Appeal Decision', 
    description: 'BP Properties Ltd v Buckler [1987] EWCA Civ 2. Court rules against family using contradictory reasoning about two BP companies.',
    category: 'irrefutable',
    sources: ['BP Properties Ltd v Buckler [1987] EWCA Civ 2', '(1988) 55 P & CR 337']
  },
  { 
    year: 'December 1988', 
    title: 'Eviction and Demolition', 
    description: 'Family forcibly evicted. 800-year-old farmhouse demolished within hours. Branwen Buckler: "Great House Farm was more than just a house. It was the family history... It is irreplaceable."',
    category: 'irrefutable',
    sources: ['South Wales Echo Dec 1988', 'Western Mail Dec 6 1988', 'Multiple newspaper archives']
  },
  { 
    year: '1989', 
    title: 'Criminal Charges Dropped', 
    description: 'Charges against Billy Buckler withdrawn as "out of time." Court orders him not to go within half a mile of the farm site.',
    category: 'irrefutable',
    sources: ['South Wales Echo 1989', 'Court records']
  },
  { 
    year: '1994', 
    title: 'Archaeological Excavation', 
    description: '1,026 burials excavated - the largest early Christian cemetery in Wales. Roman villa and medieval grange confirmed. Family receives no compensation for treasures beneath their land.',
    category: 'irrefutable',
    sources: ['Cotswold Archaeology excavation report', 'Academic publications']
  },
  { 
    year: '2024', 
    title: 'Cardiff Bay Sculpture', 
    description: 'Sculpture celebrating radio history installed at Cardiff Bay. Marconi deliberately omitted due to his fascist connections. Buckler family connection remains unacknowledged.',
    category: 'irrefutable',
    sources: ['WalesOnline 2024', 'Cardiff Council statements']
  }
];

// Email templates
const emailTemplates = {
  landRegistry: {
    subject: "Request to Record Land Dispute - Great House Farm, Llandough (1982)",
    recipient: "customersupport@landregistry.gov.uk",
    body: `Dear Land Registry,

I am writing to request that the land register be corrected to reflect that Great House Farm, Llandough (near Penarth, Wales) was in dispute in 1982.

Current records do not indicate this dispute, but I have evidence that the ownership of this property was actively contested at that time. The dispute ultimately led to the landmark case BP Properties Ltd v Buckler [1987] EWCA Civ 2.

I request that the register be annotated to show:
1. The property was subject to an ownership dispute from 1974 onwards
2. The dispute involved BP Properties Ltd and the Buckler family
3. The matter was subject to court proceedings throughout the 1980s

I enclose the following supporting documentation:
- Copy of the 1987 Court of Appeal judgment
- Newspaper articles from 1974-1988 documenting the dispute
- Evidence of continuous occupation by the Buckler family since the 1600s

Please advise what formal application I need to make to have this historical dispute recorded on the register.

Yours faithfully,
[Your Name]
[Your Address]
[Your Contact Details]`
  },
  press: {
    subject: "Historical Land Injustice: Welsh Family Displaced After 400 Years - Story Tip",
    recipient: "news.desk@walesonline.co.uk, news@bbc.co.uk, editor@westernmail.co.uk",
    body: `Dear Editor,

I am contacting you regarding a significant historical injustice that deserves investigative journalism attention.

THE BUCKLER FAMILY CASE

In 1987, the Buckler family was forcibly removed from Great House Farm, Llandough, near Penarth - land their family had occupied since the 1600s (over 400 years).

KEY FACTS:
- The family was evicted by BP Properties Ltd after a disputed court case
- The 800-year-old farmhouse was demolished within hours of the eviction
- The family lost £30,000 worth of possessions
- The case involved contradictory legal reasoning about two BP companies
- The family was denied basic utilities (water) for years prior to eviction
- Questions were raised in Parliament about the treatment of this family

HISTORICAL SIGNIFICANCE:
- The site contains a 6th-century monastery and the largest early Christian cemetery excavated in Wales (1,026 burials, 1994)
- Guglielmo Marconi stayed at the farm in 1897 while conducting his first radio transmission experiments
- The case represents systemic abuse of tenant farmers by corporate interests

The family is seeking justice, compensation, and public recognition of the wrongs committed against them.

I have extensive documentation including court records, newspaper archives from 1974-1989, and archaeological reports.

Would you be interested in covering this story?

Yours sincerely,
[Your Name]
[Contact Details]`
  },
  echr: {
    subject: "Application to European Court of Human Rights - Buckler v United Kingdom",
    recipient: "registry@echr.coe.int",
    body: `TO THE REGISTRAR
EUROPEAN COURT OF HUMAN RIGHTS

APPLICATION UNDER ARTICLES 8, 1 OF PROTOCOL NO. 1, AND 6 OF THE EUROPEAN CONVENTION ON HUMAN RIGHTS

Applicant: [Buckler Family Representative]
Respondent State: United Kingdom

FACTUAL BACKGROUND:

1. The Buckler family occupied Great House Farm, Llandough, Wales from the 1600s (over 400 years of continuous occupation).

2. In 1987, following BP Properties Ltd v Buckler [1987] EWCA Civ 2, the family was forcibly evicted and their 800-year-old home demolished.

3. The legal process was fundamentally flawed:
   - Contradictory reasoning about whether BP Properties Ltd and BP Pension Trust Ltd were the same entity
   - The court held the family lost because they didn't reply to the "right" company, yet dismissed an appeal saying both companies were "effectively the same"
   - This created an impossible position: "heads they win, tails we lose"

ALLEGED VIOLATIONS:

Article 8: Right to respect for private and family life
- Forced eviction from ancestral home
- Destruction of family property and belongings
- Separation from land occupied for 400+ years

Article 1 of Protocol No. 1: Protection of property
- Deprivation of property without fair compensation
- Unjust enrichment by corporate entities

Article 6: Right to a fair trial
- Contradictory court reasoning
- Denial of effective remedy

EXHAUSTION OF DOMESTIC REMEDIES:

All domestic remedies have been exhausted. The case reached the Court of Appeal and leave to appeal to the House of Lords was refused.

The applicant requests the Court to:
1. Find violations of the Convention
2. Award just satisfaction under Article 41
3. Recommend measures to address the injustice

Yours faithfully,
[Applicant Name]`
  },
  welshGovernment: {
    subject: "Petition for Justice - Buckler Family Land Dispossession",
    recipient: "petitions@senedd.wales, firstminister@gov.wales",
    body: `Dear Members of the Senedd,

I am writing to petition the Welsh Government to investigate the historical injustice suffered by the Buckler family of Llandough.

BACKGROUND:

The Buckler family (previously Williams) occupied Great House Farm, Llandough, from the 1600s until their forcible eviction in 1987/88. This represents over 400 years of continuous occupation of Welsh land by a Welsh farming family.

THE INJUSTICE:

1. The family was evicted by BP Properties Ltd following a disputed court case
2. Their 800-year-old farmhouse was demolished within hours of eviction
3. The legal reasoning was contradictory and unfair
4. The family lost their home, livelihood, and heritage
5. Archaeological treasures from beneath their land (1,026 burials, Roman villa) were excavated in 1994 without compensation

CULTURAL SIGNIFICANCE:

The site includes:
- A 6th-century Celtic monastery
- One of Wales's most important early Christian cemeteries
- A substantial Roman villa
- Medieval grange buildings

This represents centuries of Welsh history that was destroyed.

REQUEST:

I urge the Welsh Government to:
1. Investigate the circumstances of this eviction
2. Consider a formal apology to the Buckler family
3. Explore options for compensation or restitution
4. Ensure such injustices cannot happen again
5. Commemorate the family's connection to this historically significant site

Yours sincerely,
[Your Name]
[Your Address]`
  },
  bp: {
    subject: "Request for Justice and Compensation - Buckler Family / Great House Farm",
    recipient: "media.relations@bp.com, legal@bp.com, ceo@bp.com",
    body: `Dear BP Leadership,

I am writing on behalf of the Buckler family regarding the historical injustice committed by BP Properties Ltd against this Welsh farming family.

HISTORICAL CONTEXT:

In 1969, BP Pension Trust Ltd acquired Great House Farm, Llandough, Wales. The subsequent actions of BP-related entities led to:

1. The eviction of a family who had occupied the land since the 1600s (400+ years)
2. The demolition of an 800-year-old farmhouse within hours of eviction
3. Loss of £30,000 worth of personal possessions
4. Destruction of a family's livelihood and heritage
5. Psychological trauma affecting multiple generations

LEGAL CONCERNS:

The court case (BP Properties Ltd v Buckler [1987]) contained contradictory reasoning that made it impossible for the family to win:
- The court said Mrs. Buckler lost because she didn't reply to the "right" BP company
- Yet when appealing, the court said both BP companies were "effectively the same"
- This created a catch-22: "heads they win, tails we lose"

ESG RESPONSIBILITY:

As a modern corporation with ESG commitments, BP has a responsibility to address historical wrongs committed by its predecessor entities.

REQUEST:

I request that BP:
1. Acknowledge the harm caused to the Buckler family
2. Enter into good-faith negotiations for compensation
3. Issue a formal apology
4. Consider supporting a memorial at the site

The Buckler family has waited over 35 years for justice. It is time for BP to do the right thing.

I look forward to your response within 28 days.

Yours faithfully,
[Your Name]
On behalf of the Buckler Family Justice Campaign`}
};

// Data
const grievances = [
  { title: 'Theft of Land', description: 'A Welsh farming family\'s ancestral land stolen after 400+ years of continuous occupation through legal technicalities and corporate power.' },
  { title: 'Theft of Deeds', description: 'Original land deeds stolen from the farm in the 1950s by an itinerant worker encouraged by the estate agent. Copies went missing from Cardiff Library in 1984.' },
  { title: 'Denial of Basic Utilities', description: 'Water supply deliberately cut off by Western Ground Rents. Cattle drowned in River Ely seeking water. Family forced to live without running water.' },
  { title: 'Unfair Legal Process', description: 'Court used contradictory reasoning: family lost because they didn\'t reply to the "right" company, yet appeal dismissed because both BP companies were "effectively the same."' },
  { title: 'Forced Eviction', description: 'Family physically removed from their home. Billy Buckler evicted from hospital bed. Restraining order prevented return.' },
  { title: 'Destruction of Heritage', description: '800-year-old farmhouse demolished within hours of eviction. Family given no opportunity to retrieve belongings. £30,000 of possessions lost.' },
  { title: 'Generational Trauma', description: 'Three generations of Bucklers traumatized. Children witnessed bailiffs with axes. Family left homeless, forced to live in a converted bus.' },
  { title: 'Theft of Archaeological Treasures', description: '1,026 burials, Roman villa artifacts, medieval remains excavated from beneath family\'s land in 1994. Family received no compensation.' },
  { title: 'Historical Erasure', description: 'Connection to Marconi\'s radio experiments suppressed. No plaque commemorating 400+ years of Buckler family occupation. History rewritten to exclude indigenous Welsh family.' }
];

const actions = [
  { title: 'Land Registry Application', description: 'Apply to have the 1982 land dispute officially recorded. Correct historical records.', priority: 'Immediate' },
  { title: 'Freedom of Information Requests', description: 'Request all government records relating to the case from Ministry of Justice, Cardiff Council, National Museum of Wales.', priority: 'High' },
  { title: 'Civil Claim Against BP', description: 'Pursue damages for unlawful eviction, unjust enrichment, and abuse of process against BP corporate successors.', priority: 'High' },
  { title: 'European Court of Human Rights', description: 'Application under Articles 8, 1P1, and 6 ECHR for violations of family life, property rights, and fair trial.', priority: 'High' },
  { title: 'Welsh Government Petition', description: 'Petition the Senedd for investigation, formal apology, and compensation scheme.', priority: 'Medium' },
  { title: 'Media Campaign', description: 'Engage investigative journalists, documentary makers, and social media to raise public awareness.', priority: 'Medium' },
  { title: 'Parliamentary Action', description: 'Request Early Day Motion in UK Parliament. Contact local MP and MS for support.', priority: 'Medium' },
  { title: 'Historical Recognition', description: 'Campaign for memorial/plaque at the site acknowledging Buckler family\'s 400+ year occupation.', priority: 'Ongoing' }
];

const newspaperArticles = [
  { id: 1, title: "Open Day to Save Ancient Welsh House", source: "South Wales Echo", year: "1974", image: "/newspaper_open_day.jpg" },
  { id: 2, title: "Chainsaw Farmer Vows to Fight On", source: "South Wales Echo", year: "1988", image: "/newspaper_chainsaw_vows.jpg" },
  { id: 3, title: "Police Standoff at Great House Farm", source: "Unknown", year: "1988", image: "/newspaper_police_showdown.jpg" },
  { id: 4, title: "History Fight to Save Farm", source: "South Wales Echo", year: "Dec 3, 1988", image: "/newspaper_history_fight.jpg" },
  { id: 5, title: "Farmer Fails in Final Eviction Hearing", source: "Western Mail", year: "Dec 6, 1988", image: "/newspaper_farmer_fails.jpg" },
  { id: 6, title: "Tears Flow as 800 Year-Old Farm House is Razed", source: "Unknown", year: "Dec 1988", image: "/newspaper_tears_flow.jpg" },
  { id: 7, title: "Billy's Unhappy Family", source: "South Wales Echo", year: "Dec 3, 1988", image: "/newspaper_billys_family.jpg" },
  { id: 8, title: "From Farm to a Bus", source: "South Wales Echo", year: "1989", image: "/newspaper_farm_to_bus.png" },
  { id: 9, title: "Charge Against Evicted Farmer Dropped", source: "South Wales Echo", year: "1989", image: "/newspaper_charge_dropped.png" }
];

// Filter configuration
const filterConfig = {
  irrefutable: {
    label: 'Irrefutable Fact',
    description: 'Court documents, newspaper archives, official records',
    color: 'bg-green-600',
    textColor: 'text-green-600',
    icon: Shield
  },
  general: {
    label: 'General',
    description: 'Commonly accepted facts, family testimony, historical records',
    color: 'bg-amber-600',
    textColor: 'text-amber-600',
    icon: HelpCircle
  },
  unsubstantiated: {
    label: 'Unsubstantiated',
    description: 'Claims without documented evidence from reputable sources',
    color: 'bg-red-600',
    textColor: 'text-red-600',
    icon: XCircle
  }
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [copied, setCopied] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<Record<EvidenceCategory, boolean>>({
    irrefutable: true,
    general: true,
    unsubstantiated: true
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      setMenuOpen(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleFilter = (category: EvidenceCategory) => {
    setTimelineFilter(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredTimeline = timeline.filter(event => timelineFilter[event.category]);

  const navItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'gallery', label: 'Newspaper Gallery', icon: ImageIcon },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'grievances', label: 'Grievances', icon: AlertTriangle },
    { id: 'actions', label: 'Actions Forward', icon: Gavel },
    { id: 'emails', label: 'Draft Emails', icon: Mail },
    { id: 'contacts', label: 'Contact List', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-900 text-stone-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-stone-100 hover:bg-stone-800">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-stone-900 text-stone-100 w-80">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-stone-700">
                      <h2 className="text-xl font-serif font-bold text-amber-400">Buckler Justice</h2>
                      <p className="text-sm text-stone-400">Justice for a Welsh Family</p>
                    </div>
                    <nav className="flex-1 p-4">
                      <ul className="space-y-2">
                        {navItems.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => scrollToSection(item.id)}
                              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                activeSection === item.id
                                  ? 'bg-amber-600 text-white'
                                  : 'hover:bg-stone-800 text-stone-300'
                              }`}
                            >
                              <item.icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    <div className="p-4 border-t border-stone-700">
                      <button
                        onClick={() => setShowSource(true)}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-800 text-stone-300 transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span>See Page Source Code</span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-amber-400">Buckler Family Justice</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSource(true)}
              className="hidden sm:flex items-center space-x-2 text-stone-300 hover:text-stone-100 hover:bg-stone-800"
            >
              <FileText className="h-4 w-4" />
              <span>See Code</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Source Code Dialog */}
      <Dialog open={showSource} onOpenChange={setShowSource}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-stone-900 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-amber-400 font-serif">Page Source Code</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-sm font-mono text-stone-300 p-4 whitespace-pre-wrap">{sourceCode}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-amber-600 text-white hover:bg-amber-700">Historical Land Injustice</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-amber-400 mb-6">
              The Buckler Family Case
            </h1>
            <p className="text-xl sm:text-2xl text-stone-300 mb-4 font-serif italic">
              "It's my land. It's not your permission to give."
            </p>
            <p className="text-stone-400 mb-8">— Mary Williams Buckler, October 1974</p>
            <div className="max-w-3xl mx-auto bg-stone-800/50 rounded-xl p-6 border border-stone-700">
              <p className="text-lg text-stone-300 leading-relaxed">
                A Welsh farming family, indigenous Britons on their ancestral birthland since the 1600s, 
                forcibly removed from Great House Farm, Llandough, after a 400-year occupation. 
                Their 800-year-old home demolished by BP Properties Ltd within hours of eviction.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => scrollToSection('gallery')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                View Evidence
              </Button>
              <Button 
                onClick={() => scrollToSection('emails')}
                variant="outline"
                className="border-stone-600 text-stone-300 hover:bg-stone-800"
              >
                <Mail className="h-4 w-4 mr-2" />
                Take Action
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            <div>
              <div className="text-3xl sm:text-4xl font-bold">400+</div>
              <div className="text-sm opacity-90">Years Occupation</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">800</div>
              <div className="text-sm opacity-90">Year-Old Farm</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">35</div>
              <div className="text-sm opacity-90">Year Legal Battle</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">1,026</div>
              <div className="text-sm opacity-90">Burials Excavated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newspaper Gallery */}
      <section id="gallery" className="py-16 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-2">Newspaper Archive Gallery</h2>
          <p className="text-stone-600 mb-8">Primary source evidence documenting the Buckler family's struggle</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newspaperArticles.map((article) => (
              <Dialog key={article.id}>
                <DialogTrigger asChild>
                  <div className="cursor-pointer group">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-stone-200 transition-transform group-hover:scale-[1.02]">
                      <div className="aspect-[4/3] bg-stone-200 overflow-hidden">
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <Badge className="mb-2 bg-stone-800 text-stone-100">{article.year}</Badge>
                        <h3 className="font-serif font-semibold text-stone-900 line-clamp-2">{article.title}</h3>
                        <p className="text-sm text-stone-500 mt-1">{article.source}</p>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-stone-50">
                  <DialogHeader>
                    <DialogTitle className="font-serif">{article.title}</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-auto">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-auto"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="py-16 bg-stone-900 text-stone-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-400 mb-2 text-center">Timeline of Injustice</h2>
          <p className="text-stone-400 text-center mb-8">Filter by evidence category</p>
          
          {/* Filter Controls */}
          <div className="mb-8 bg-stone-800 rounded-lg p-4 border border-stone-700">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-stone-200">Filter Timeline</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(filterConfig) as EvidenceCategory[]).map((category) => {
                const config = filterConfig[category];
                const Icon = config.icon;
                return (
                  <button
                    key={category}
                    onClick={() => toggleFilter(category)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      timelineFilter[category]
                        ? 'bg-stone-700 border-stone-600'
                        : 'bg-stone-800/50 border-stone-700 opacity-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${config.color}`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-stone-200">{config.label}</div>
                      <div className="text-xs text-stone-500">{config.description}</div>
                    </div>
                    {timelineFilter[category] && (
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-stone-500">
              Showing {filteredTimeline.length} of {timeline.length} events
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
            {(Object.keys(filterConfig) as EvidenceCategory[]).map((category) => {
              const config = filterConfig[category];
              return (
                <div key={category} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <span className="text-stone-400">{config.label}</span>
                </div>
              );
            })}
          </div>
          
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-stone-700"></div>
            
            {filteredTimeline.map((item, index) => {
              const config = filterConfig[item.category];
              return (
                <div key={index} className="relative pl-12 sm:pl-20 pb-8">
                  <div className={`absolute left-2 sm:left-6 w-4 h-4 rounded-full border-4 border-stone-900 ${config.color}`}></div>
                  <div className="bg-stone-800 rounded-lg p-4 sm:p-6 border border-stone-700">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={`${config.color} text-white`}>{item.year}</Badge>
                      <Badge variant="outline" className={`text-xs ${config.textColor} border-current`}>
                        {config.label}
                      </Badge>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif font-semibold text-stone-100 mb-2">{item.title}</h3>
                    <p className="text-stone-400 text-sm sm:text-base mb-3">{item.description}</p>
                    {item.sources && (
                      <div className="text-xs text-stone-500">
                        <span className="font-medium">Sources:</span> {item.sources.join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredTimeline.length === 0 && (
              <div className="text-center py-12 text-stone-500">
                <p>No events match the selected filters.</p>
                <p className="text-sm mt-2">Please select at least one evidence category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grievances */}
      <section id="grievances" className="py-16 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-red-900 mb-2">Grievances & Injustices</h2>
          <p className="text-red-700 mb-8">The wrongs committed against the Buckler family</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grievances.map((grievance, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif font-semibold text-red-900 mb-2">{grievance.title}</h3>
                    <p className="text-stone-600 text-sm">{grievance.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Actions Forward */}
      <section id="actions" className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-green-900 mb-2">Actions Forward</h2>
          <p className="text-green-700 mb-8">Steps to rectify the injustices and rewrite history</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {actions.map((action, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Gavel className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-serif font-semibold text-green-900 mb-2">{action.title}</h3>
                      <p className="text-stone-600 text-sm mb-3">{action.description}</p>
                    </div>
                  </div>
                </div>
                <Badge className={`${action.priority === 'Immediate' ? 'bg-red-600' : action.priority === 'High' ? 'bg-amber-600' : 'bg-green-600'} text-white`}>
                  {action.priority} Priority
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Draft Emails */}
      <section id="emails" className="py-16 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-2">Draft Emails</h2>
          <p className="text-stone-600 mb-8">Ready-to-send emails to support the Buckler family campaign</p>
          
          <Tabs defaultValue="landRegistry" className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-stone-200">
              <TabsTrigger value="landRegistry" className="text-xs sm:text-sm">Land Registry</TabsTrigger>
              <TabsTrigger value="press" className="text-xs sm:text-sm">Press</TabsTrigger>
              <TabsTrigger value="echr" className="text-xs sm:text-sm">ECHR</TabsTrigger>
              <TabsTrigger value="welshGov" className="text-xs sm:text-sm">Welsh Gov</TabsTrigger>
              <TabsTrigger value="bp" className="text-xs sm:text-sm">BP</TabsTrigger>
            </TabsList>
            
            {Object.entries(emailTemplates).map(([key, template]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="bg-white rounded-lg shadow-md border border-stone-200 overflow-hidden">
                  <div className="bg-stone-800 text-stone-100 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm"><span className="text-stone-400">To:</span> {template.recipient}</p>
                        <p className="text-sm"><span className="text-stone-400">Subject:</span> {template.subject}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(`To: ${template.recipient}\n\nSubject: ${template.subject}\n\n${template.body}`, 'Full Email')}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {copied === 'Full Email' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy All
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(template.body, 'Email Body')}
                      >
                        {copied === 'Email Body' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy Body
                      </Button>
                    </div>
                    <ScrollArea className="h-96 bg-stone-50 rounded-lg p-4 border border-stone-200">
                      <pre className="text-sm text-stone-700 whitespace-pre-wrap font-sans">{template.body}</pre>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Contact List */}
      <section id="contacts" className="py-16 bg-stone-900 text-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-400 mb-8">Contact List</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Land Registry */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="font-serif font-semibold text-amber-400 mb-4">HM Land Registry</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-400">Email:</span> customersupport@landregistry.gov.uk</p>
                <p><span className="text-stone-400">Phone:</span> 0300 006 0411</p>
                <p><span className="text-stone-400">Web:</span> www.gov.uk/land-registry</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-stone-600 text-stone-300 hover:bg-stone-700"
                  onClick={() => copyToClipboard('customersupport@landregistry.gov.uk', 'Land Registry Email')}
                >
                  {copied === 'Land Registry Email' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Email
                </Button>
              </div>
            </div>

            {/* Welsh Government */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="font-serif font-semibold text-amber-400 mb-4">Welsh Government</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-400">Petitions:</span> petitions@senedd.wales</p>
                <p><span className="text-stone-400">First Minister:</span> firstminister@gov.wales</p>
                <p><span className="text-stone-400">Phone:</span> 0300 025 4747</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-stone-600 text-stone-300 hover:bg-stone-700"
                  onClick={() => copyToClipboard('petitions@senedd.wales', 'Welsh Gov Email')}
                >
                  {copied === 'Welsh Gov Email' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Email
                </Button>
              </div>
            </div>

            {/* European Court of Human Rights */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="font-serif font-semibold text-amber-400 mb-4">European Court of Human Rights</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-400">Registry:</span> registry@echr.coe.int</p>
                <p><span className="text-stone-400">Address:</span> Council of Europe, Strasbourg</p>
                <p><span className="text-stone-400">Web:</span> www.echr.coe.int</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-stone-600 text-stone-300 hover:bg-stone-700"
                  onClick={() => copyToClipboard('registry@echr.coe.int', 'ECHR Email')}
                >
                  {copied === 'ECHR Email' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Email
                </Button>
              </div>
            </div>

            {/* BP */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="font-serif font-semibold text-amber-400 mb-4">BP plc</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-400">Media:</span> media.relations@bp.com</p>
                <p><span className="text-stone-400">Address:</span> 1 St James's Square, London</p>
                <p><span className="text-stone-400">Web:</span> www.bp.com</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-stone-600 text-stone-300 hover:bg-stone-700"
                  onClick={() => copyToClipboard('media.relations@bp.com', 'BP Email')}
                >
                  {copied === 'BP Email' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Email
                </Button>
              </div>
            </div>

            {/* Press */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="font-serif font-semibold text-amber-400 mb-4">Welsh Press</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-400">Wales Online:</span> news.desk@walesonline.co.uk</p>
                <p><span className="text-stone-400">Western Mail:</span> editor@westernmail.co.uk</p>
                <p><span className="text-stone-400">BBC Wales:</span> wales@bbc.co.uk</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-stone-600 text-stone-300 hover:bg-stone-700"
                  onClick={() => copyToClipboard('news.desk@walesonline.co.uk', 'Press Email')}
                >
                  {copied === 'Press Email' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Email
                </Button>
              </div>
            </div>

            {/* UK Parliament */}
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="font-serif font-semibold text-amber-400 mb-4">UK Parliament</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-400">Find your MP:</span> members.parliament.uk</p>
                <p><span className="text-stone-400">WriteToThem:</span> www.writetothem.com</p>
                <p><span className="text-stone-400">Switchboard:</span> 020 7219 3000</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-stone-600 text-stone-300 hover:bg-stone-700"
                  onClick={() => window.open('https://members.parliament.uk', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Find MP
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-stone-950 text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-amber-400 mb-4">Buckler Family Justice Campaign</h3>
            <p className="max-w-2xl mx-auto mb-6">
              Justice for a Welsh farming family displaced after 400 years on their ancestral birthland. 
              Join us in demanding recognition, compensation, and the rewriting of history.
            </p>
            <Separator className="bg-stone-800 my-6" />
            <p className="text-sm text-stone-500">
              This website is a living document. Updates will be added as the campaign progresses.
            </p>
            <p className="text-sm text-stone-600 mt-2">
              "Justice will not be served until those who are unaffected are as outraged as those who are." — Benjamin Franklin
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
