import InstitutionalPageLayout from "@/components/InstitutionalPageLayout";

export default function ContactPage() {
    const contactEmail = "cenasdecombate@gmail.com";

    return (
        <InstitutionalPageLayout
            title="Contato"
            eyebrow="Institucional"
            breadcrumbLabel="Contato"
            description="Canal para dúvidas, correções, sugestões de pauta, propostas comerciais e assuntos relacionados ao projeto editorial."
        >
            <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm not-prose">
                    <h2 className="text-xl font-bold text-foreground">Fale com o site</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        Para entrar em contato com o Cenas de Combate, envie um e-mail para:
                    </p>

                    <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{contactEmail}</p>
                    </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm not-prose">
                    <h2 className="text-xl font-bold text-foreground">Assuntos atendidos</h2>

                    <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                        <li>• dúvidas sobre conteúdos publicados;</li>
                        <li>• sugestões de pauta;</li>
                        <li>• correções e atualizações;</li>
                        <li>• contato institucional;</li>
                        <li>• propostas comerciais e parcerias.</li>
                    </ul>
                </section>
            </div>

            <h2>Observações</h2>
            <p>
                O envio de mensagens não garante resposta imediata. Comunicações
                ofensivas, spam ou indevidas podem ser desconsideradas.
            </p>
        </InstitutionalPageLayout>
    );
}