import { Link } from "wouter";
import InstitutionalPageLayout from "@/components/InstitutionalPageLayout";

export default function AboutPage() {
    return (
        <InstitutionalPageLayout
            title="Sobre o Cenas de Combate"
            eyebrow="Institucional"
            breadcrumbLabel="Sobre"
            description="Um portal editorial dedicado à história militar, geopolítica, conflitos, tecnologia de defesa e contexto estratégico dos acontecimentos que moldam o mundo."
        >
            <p>
                O <strong>Cenas de Combate</strong> nasceu com a proposta de explicar
                guerras, disputas geopolíticas, conflitos históricos e acontecimentos
                militares com mais contexto, profundidade e clareza.
            </p>

            <p>
                A ideia central do projeto é ir além da notícia rápida, oferecendo uma
                leitura mais ampla sobre operações militares, armamentos, decisões
                estratégicas e os bastidores que ajudam a entender o impacto dos
                conflitos na história e no presente.
            </p>

            <h2>O que você encontra aqui</h2>
            <ul>
                <li>matérias sobre guerras e conflitos históricos;</li>
                <li>análises de geopolítica e segurança internacional;</li>
                <li>conteúdo sobre aviação e tecnologia militar;</li>
                <li>contexto histórico para temas atuais;</li>
                <li>textos explicativos com linguagem acessível.</li>
            </ul>

            <h2>Compromisso editorial</h2>
            <p>
                O compromisso do site é publicar conteúdo informativo, contextualizado e
                editorialmente responsável, sempre com foco em clareza, relevância e
                interesse público.
            </p>

            <h2>Sustentação do projeto</h2>
            <p>
                O portal pode utilizar anúncios e plataformas de monetização para apoiar
                sua manutenção, atualização e crescimento.
            </p>

            <h2>Contato</h2>
            <p>
                Para sugestões, correções ou assuntos institucionais, acesse a página de{" "}
                <Link href="/contato">Contato</Link>.
            </p>
        </InstitutionalPageLayout>
    );
}