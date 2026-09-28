// Course shell: top bar, outline drawer, the routed page and the "on this
// page" rail. Routing is the URL hash (lib/route); the drawer state lives
// here because the top bar opens it and the outline, scrim and Escape close it.
import { useEffect, useState } from 'react';
import LessonView from './components/LessonView';
import Outline from './components/Outline';
import Toc from './components/Toc';
import TopBar from './components/TopBar';
import type { Section } from './lib/lessonDom';
import { useRoute } from './lib/route';
import Playground from './pages/Playground';

export default function App() {
  const route = useRoute();
  const lessonId = route.kind === 'lesson' ? route.id : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  // Back/forward on a phone with the drawer open: close it like a tap would.
  useEffect(() => { setMenuOpen(false); }, [lessonId]);

  useEffect(() => {
    if (lessonId === null) document.title = 'SQL Playground · Sky Library';
  }, [lessonId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <>
      <TopBar menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} />
      <div className={`app${lessonId === null ? ' wide' : ''}`}>
        <Outline currentId={lessonId} open={menuOpen} onClose={close} />
        <div className="scrim" id="scrim" hidden={!menuOpen} onClick={close} />
        <main>
          {lessonId === null ? <Playground /> : <LessonView id={lessonId} onSections={setSections} />}
        </main>
        {lessonId !== null && <Toc sections={sections} />}
      </div>
    </>
  );
}
