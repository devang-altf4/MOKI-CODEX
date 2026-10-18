import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Check, Mail, MapPin } from 'lucide-react';
import { challenges, EMAIL, industries } from '../content';
import { Eyebrow } from './Primitives';
import { useContactMotion } from './ScrollMotion';
import { LeadForm } from './LeadForm';
import { useDemoRequest } from './DemoRequest';

export default function ContactPage() {
  const contactRoot = useContactMotion();
  const { markRequested } = useDemoRequest();
  const [params] = useSearchParams();
  const initialService = params.get('service') || challenges.find(c => c.id === params.get('challenge'))?.service || '';
  const industryIndex = params.get('industry');
  const selectedIndustry = industryIndex !== null ? industries[Number(industryIndex)] : undefined;
  return <section className="contact-page" ref={contactRoot}><div className="contact-orbit" aria-hidden="true" /><div className="container contact-layout"><div className="contact-copy"><Eyebrow>LET’S FIND YOUR STARTING POINT</Eyebrow><h1>A better system<br />starts with a<br /><span className="text-blue">conversation.</span></h1><p>Tell us a little about your business and what’s getting in the way. We’ll explore a practical next step together.</p><div className="contact-expect"><span className="mono">YOUR FREE DISCOVERY CALL</span><div><Check size={15} />Talk through how your business works.</div><div><Check size={15} />Explore where AI or automation could help.</div><div><Check size={15} />Find a sensible place to start.</div></div><div className="contact-info"><a href={`mailto:${EMAIL}`}><Mail size={17} /><span>{EMAIL}</span><ArrowUpRight size={15} /></a><p><MapPin size={17} /><span>South Florida, USA<br /><small>Working with businesses worldwide.</small></span></p></div></div><div className="contact-form-wrap"><div className="contact-form-header"><span className="status-dot" /><span>LET’S MAKE WORK FLOW.</span><span className="mono">01 / HELLO</span></div><h2>Tell us what’s on your mind.</h2><p className="form-intro">Send your request to MOKI. You can also prepare an email draft.</p><LeadForm source="contact-page" onSaved={markRequested} initialService={initialService} initialChallenge={selectedIndustry ? `We work in ${selectedIndustry.full.toLowerCase()} and would like to explore how MOKI could help.` : ''} /></div></div></section>;
}
