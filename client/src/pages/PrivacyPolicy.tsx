import InstitutionalPageLayout from "@/components/InstitutionalPageLayout";
import { Link } from "wouter";

export default function PrivacyPolicy() {
    return (
        <InstitutionalPageLayout
            title="Política de Privacidade"
            eyebrow="Legal"
            breadcrumbLabel="Política de Privacidade"
            updatedAt="22 de abril de 2026"
            description="Entenda como o Cenas de Combate trata informações de navegação, cookies, publicidade e dados técnicos utilizados para funcionamento, medição e monetização do site."
        >
            <p>
                A sua privacidade é importante para nós. É política do{" "}
                <strong>Cenas de Combate</strong> respeitar a sua privacidade em relação
                a qualquer informação que possamos coletar no site.
            </p>

            <p>
                Solicitamos informações pessoais apenas quando realmente precisamos
                delas para fornecer algum serviço, atendimento ou resposta. Fazemos isso
                por meios justos e legais, com o seu conhecimento quando aplicável, e
                explicamos por que os dados estão sendo coletados e como podem ser
                utilizados.
            </p>

            <p>
                Apenas retemos informações pelo tempo necessário para cumprir as
                finalidades descritas nesta política, respeitando obrigações legais,
                operacionais e de segurança. Quando armazenamos dados, adotamos medidas
                tecnicamente razoáveis para protegê-los contra perda, roubo, acesso não
                autorizado, divulgação, cópia, uso ou modificação indevida.
            </p>

            <p>
                Não compartilhamos informações de identificação pessoal publicamente ou
                com terceiros, exceto quando necessário para o funcionamento do site,
                prestação de serviços, cumprimento de obrigações legais ou proteção de
                direitos.
            </p>

            <h2>1. Links para sites externos</h2>
            <p>
                O nosso site pode conter links para sites externos que não são operados
                por nós. Esteja ciente de que não temos controle sobre o conteúdo e as
                práticas desses sites e não podemos aceitar responsabilidade por suas
                respectivas políticas de privacidade.
            </p>

            <h2>2. Aceitação desta política</h2>
            <p>
                O uso continuado do site será considerado como aceitação das nossas
                práticas relacionadas à privacidade e ao tratamento de informações. Se
                você tiver dúvidas sobre como lidamos com dados, entre em contato
                conosco pela página de <Link href="/contato">Contato</Link>.
            </p>

            <h2>3. Política de Cookies</h2>
            <p>
                Como é prática comum em quase todos os sites profissionais, este site
                utiliza cookies, que são pequenos arquivos baixados no seu dispositivo,
                para melhorar a experiência de navegação, medir audiência, lembrar
                preferências e apoiar funcionalidades e publicidade.
            </p>

            <h2>4. Como usamos os cookies</h2>
            <p>Utilizamos cookies por diversos motivos, como:</p>
            <ul>
                <li>melhorar o funcionamento e o desempenho do site;</li>
                <li>entender como os usuários navegam pelas páginas;</li>
                <li>lembrar preferências de navegação;</li>
                <li>medir audiência e desempenho de conteúdo;</li>
                <li>apoiar a exibição de anúncios.</li>
            </ul>

            <h2>5. Desativação de cookies</h2>
            <p>
                Você pode impedir a configuração de cookies ajustando as opções do seu
                navegador. Esteja ciente de que a desativação de cookies pode afetar a
                funcionalidade deste site e de outros que você visita.
            </p>

            <h2>6. Cookies de terceiros</h2>
            <p>
                Em alguns casos, utilizamos cookies fornecidos por terceiros confiáveis.
                Este site pode usar ferramentas de análise para compreender como o
                visitante utiliza o conteúdo, quais páginas são mais acessadas e como a
                experiência pode ser melhorada.
            </p>

            <p>
                Este site também pode exibir anúncios por meio de parceiros de
                publicidade, incluindo o Google AdSense. Terceiros, incluindo o Google,
                podem usar cookies para veicular anúncios com base nas visitas
                anteriores do usuário a este e a outros sites.
            </p>

            <p>
                Esses cookies podem ser utilizados para exibir anúncios mais relevantes,
                limitar a repetição de anúncios e medir o desempenho da publicidade.
            </p>

            <h2>7. Publicidade</h2>
            <p>
                Utilizamos publicidade para ajudar a compensar os custos de funcionamento
                do site e apoiar a produção de novos conteúdos. Os parceiros de
                publicidade podem usar cookies, identificadores e tecnologias
                semelhantes para veicular, medir e otimizar anúncios.
            </p>

            <h2>8. Compromisso do usuário</h2>
            <p>
                O usuário se compromete a fazer uso adequado dos conteúdos e das
                informações que o Cenas de Combate oferece no site, e, de forma
                exemplificativa, mas não limitativa:
            </p>

            <ul>
                <li>
                    não se envolver em atividades ilegais ou contrárias à boa-fé e à ordem
                    pública;
                </li>
                <li>
                    não difundir conteúdo ilícito, discriminatório, violento, fraudulento
                    ou que viole direitos de terceiros;
                </li>
                <li>
                    não causar danos aos sistemas físicos e lógicos do site, de seus
                    fornecedores ou de terceiros;
                </li>
                <li>
                    não introduzir ou disseminar vírus, malwares ou quaisquer outros
                    sistemas capazes de causar danos.
                </li>
            </ul>

            <h2>9. Mais informações</h2>
            <p>
                Esperamos que esta política esteja clara. Se houver algo que você não
                tem certeza se precisa ou não, geralmente é mais seguro manter cookies
                habilitados, caso interaja com recursos do site que dependam deles.
            </p>

            <p>
                Para dúvidas sobre esta Política de Privacidade, acesse a página de{" "}
                <Link href="/contato">Contato</Link>.
            </p>
        </InstitutionalPageLayout>
    );
}