import { Link } from "wouter";
import InstitutionalPageLayout from "@/components/InstitutionalPageLayout";

export default function TermsPage() {
    return (
        <InstitutionalPageLayout
            title="Termos de Uso"
            eyebrow="Legal"
            breadcrumbLabel="Termos de Uso"
            updatedAt="22 de abril de 2026"
            description="Regras gerais de utilização do portal, propriedade intelectual, responsabilidade sobre conteúdo e condições aplicáveis à navegação no site."
        >
            <p>
                Ao acessar e utilizar o <strong>Cenas de Combate</strong>, o visitante
                concorda com estes Termos de Uso.
            </p>

            <h2>1. Finalidade do site</h2>
            <p>
                O portal é voltado à publicação de conteúdo editorial e informativo sobre
                história militar, geopolítica, conflitos, estratégia e temas
                relacionados.
            </p>

            <h2>2. Uso permitido</h2>
            <ul>
                <li>não utilizar o site para fins ilícitos;</li>
                <li>não comprometer a segurança ou estabilidade da plataforma;</li>
                <li>não reproduzir conteúdo sem autorização, quando aplicável;</li>
                <li>não utilizar o site para fraude, spam ou abuso.</li>
            </ul>

            <h2>3. Propriedade intelectual</h2>
            <p>
                Salvo indicação em contrário, textos, identidade visual e estrutura
                editorial do site pertencem ao projeto ou são usados com permissão.
            </p>

            <h2>4. Conteúdo e responsabilidade</h2>
            <p>
                O portal busca manter informações corretas e atualizadas, mas não garante
                ausência total de erros, omissões ou desatualizações.
            </p>

            <h2>5. Links e serviços externos</h2>
            <p>
                O site pode conter links para páginas e serviços de terceiros. Não somos
                responsáveis pelo conteúdo ou pelas práticas desses ambientes externos.
            </p>

            <h2>6. Publicidade</h2>
            <p>
                O site pode exibir publicidade e utilizar ferramentas de monetização para
                sustentar a operação do projeto.
            </p>

            <h2>7. Privacidade</h2>
            <p>
                O uso do site também está sujeito à nossa{" "}
                <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
            </p>

            <h2>8. Atualizações</h2>
            <p>
                Estes termos podem ser modificados a qualquer momento, sempre com a
                versão mais recente disponível nesta página.
            </p>
        </InstitutionalPageLayout>
    );
}