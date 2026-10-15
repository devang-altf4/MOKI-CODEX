import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import '../type-study.css';

export default function TypeStudy() {
  return <section className="type-study container"><p className="eyebrow">MOKI / TYPE DIRECTION</p><h1>A little more character.</h1><p className="type-study-intro">The same words. Three different personalities. Choose the one that feels right.</p><div className="type-options">{[
    ['a', 'Bold + expressive', 'Tall, confident headlines. A little unexpected elegance.'],
    ['b', 'Future + precise', 'Geometric, modern, and unmistakably technology.'],
    ['c', 'Editorial + elegant', 'Airy, sophisticated, with the words doing the talking.'],
  ].map(([id, name, detail]) => <article className={`type-option type-${id}`} key={id}><div className="type-label"><span>{id.toUpperCase()}</span><strong>{name}</strong></div><div className="type-sample"><h2><span>Less busywork.</span><span>More <em>business.</em></span></h2><div className="type-method"><strong>MAP</strong><em>the mess.</em></div></div><p>AI that helps. Systems that connect. More room for what comes next.</p><div className="type-option-bottom"><p>{detail}</p><Link to={`/?type=${id}`}>Preview this on the site <ArrowUpRight size={15} /></Link></div></article>)}</div></section>;
}
