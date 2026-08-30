import Hero from '@/app/components/sections/Hero';
import Projects from '@/app/components/sections/Projects';
import About from '@/app/components/sections/About';
import Skills from '@/app/components/sections/Skills';
import Blog from '@/app/components/sections/Blog';
import Contact from '@/app/components/sections/Contact';
import MissionLog from '@/app/components/sections/mission/MissionLog';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <MissionLog>
        <Projects />
        <About />
        <Skills />
        <Blog />
        <Contact />
      </MissionLog>
    </main>
  );
}
