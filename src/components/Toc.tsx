// "On this page" rail (≥1180px). Buttons, not anchors: a hash link would
// change the route and reload the lesson instead of scrolling.
import { scrollToSection, type Section } from '../lib/lessonDom';

interface Props {
  sections: Section[];
}

export default function Toc({ sections }: Props) {
  return (
    <aside className="toc" id="toc" aria-label="On this page">
      <span className="overline">On this page</span>
      {sections.map(s => (
        <button type="button" key={s.id} data-to={s.id} onClick={() => scrollToSection(s.id)}>{s.label}</button>
      ))}
    </aside>
  );
}
