// Portal shell: top bar, outline drawer, the routed page and the "on this
// page" rail. Routing is the URL hash (lib/route); the drawer state lives
// here because the top bar opens it and the outline, scrim and Escape close it.
import { useEffect, useState } from 'react';
import LessonView from './components/LessonView';
import Outline from './components/Outline';
import Toc from './components/Toc';
import TopBar from './components/TopBar';
import type { Section } from './lib/lessonDom';
import { useRoute } from './lib/route';
import Home from './pages/Home';
import Playground from './pages/Playground';

const PAGE_TITLE = { home: 'Choose your course · Sky Library', playground: 'SQL Playground · Sky Library' } as const;

export default function App() {
  const route = useRoute();
  const lesson = route.kind === 'lesson' ? route : null;
  const courseId = lesson?.courseId ?? null;
  const lessonId = lesson?.id ?? null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  // Back/forward on a phone with the drawer open: close it like a tap would.
  useEffect(() => { setMenuOpen(false); }, [route.kind, courseId, lessonId]);

  // Lessons set their own title (LessonView) once the outline entry is known.
  useEffect(() => {
    if (route.kind !== 'lesson') document.title = PAGE_TITLE[route.kind];
  }, [route.kind]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <>
      <TopBar courseId={courseId} page={route.kind} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} />
      <div className={`app${lesson ? '' : ' wide'}`}>
        <Outline courseId={courseId} currentId={lessonId} onPlayground={route.kind === 'playground'} open={menuOpen} onClose={close} />
        <div className="scrim" id="scrim" hidden={!menuOpen} onClick={close} />
        <main>
          {lesson
            ? <LessonView courseId={lesson.courseId} id={lesson.id} onSections={setSections} />
            : route.kind === 'playground' ? <Playground /> : <Home />}
        </main>
        {lesson && <Toc sections={sections} />}
      </div>
    </>
  );
}
