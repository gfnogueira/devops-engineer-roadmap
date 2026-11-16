# Gerenciamento de Mudanças Locais com Git

## Visão geral

**Competência:** `git-change-management` · **Nível:** Fundamentos · **Revisão da avaliação:** 1

Você mantém algumas anotações de um `demo-service` fictício. É preciso registrar mudanças selecionadas, conferir exatamente o que cada registro vai conter, desfazer três erros comuns e manter uma credencial falsa fora dos novos registros. Você também investiga a afirmação de que uma regra de ignorar tornou seguro um arquivo que já havia sido registrado.

Tudo acontece em um diretório descartável no seu próprio computador. Não há repositório remoto, conta, acesso à rede nem credencial real envolvidos. Branches, remotos e reescrita de histórico ficam deliberadamente fora deste módulo.

Siga **Aprender → Praticar → Construir → Validar**: leia os conceitos, conclua o laboratório guiado em `guided-repo`, resolva uma situação diferente em `challenge-repo` e, antes da limpeza, revise suas evidências em relação a cada critério de conclusão. O objetivo é prever e verificar o que o Git fará, não decorar comandos.

**Situação da verificação:** os recursos listados abaixo foram abertos e seu conteúdo relevante foi inspecionado em **2026-11-13**. Os comandos passaram apenas por revisão de documentação, segurança, portabilidade e sintaxe de shell. O laboratório e o desafio **não foram executados**. O comportamento do Git, a compatibilidade com Linux/macOS, a recuperação após interrupção e a limpeza ainda aguardam validação prática; nenhuma versão do Git foi testada na prática com esta lição. Os pontos de verificação descrevem resultados esperados, não resultados registrados. Uma verificação de sintaxe do shell não estabelece que um comando do Git se comporta como descrito.

*Nota sobre os blocos de código: comandos, comentários e saídas de exemplo permanecem em inglês, exatamente como no módulo canônico, para que você possa compará-los com manuais e com o que o seu terminal mostra. O texto em português ao redor explica o que cada bloco faz. Neste módulo, “sintético” significa fictício: criado apenas para o exercício e sem valor real. Termos como `commit`, `branch` e `merge` ficam em inglês. Os demais termos do Git aparecem em português, com o original entre parênteses na primeira ocorrência, como em “área de preparação (staging area)”.*

## Por que isso importa

O trabalho de infraestrutura e de entrega consiste, em grande parte, em mudanças em texto: configurações, scripts, listas de verificação e documentação. O Git registra essas mudanças como um histórico em que outras pessoas e sistemas automatizados passam a confiar. Um registro é útil quando contém uma mudança compreensível e nada além dela.

Dois erros comuns causam a maior parte dos problemas iniciais. O primeiro é registrar mais do que o pretendido, como um rascunho não relacionado ou uma credencial que estava no mesmo diretório. O segundo é achar que uma correção posterior apagou o registro anterior. O Git foi projetado para manter o histórico; é isso que torna a recuperação possível e também é por isso que um segredo registrado deve ser tratado como exposto.

O hábito a construir é curto: **inspecionar, selecionar, revisar, registrar, verificar.** Ele vale para todos os fluxos de trabalho com Git que você encontrará depois, inclusive em repositórios compartilhados.

## Pré-requisitos

Competência obrigatória: [Operações Seguras com Arquivos no Terminal](terminal-file-operations.md). Antes de começar, você deve ser capaz de identificar sua localização com `pwd -P`, colocar um caminho entre aspas, criar arquivos de texto sintéticos e acrescentar conteúdo a eles, ler um status de saída imediatamente com `$?` e remover apenas artefatos conhecidos do laboratório. Use, se precisar, a [orientação sobre diretório inicial](terminal-file-operations.md#encontre-um-diretório-inicial) desse módulo.

Nenhuma outra competência é exigida. As ideias mínimas de segurança de que você precisa são apresentadas em [Segredos e registros duráveis](#segredos-e-registros-duráveis). [Acesso Local e Segredos de Teste](local-access-and-secrets.md) é um estudo opcional relacionado, não um pré-requisito.

Ambiente necessário:

- Um terminal local Linux ou macOS com `/bin/sh` e os utilitários padrão do pré-requisito, além de `find` e do `read` do shell, que aparecem apenas em auxiliares de segurança explicados aqui.
- **Git já instalado**, na versão **2.32.0 ou posterior**. O laboratório verifica isso e para se o requisito não for atendido. Esta lição não instala nem atualiza o Git; veja [Versões do Git](#versões-do-git).
- Uma sessão comum, sem privilégios administrativos, e um diretório pessoal existente e gravável em um sistema de arquivos local **que não esteja dentro de nenhum repositório Git**. Evite diretórios compartilhados, sincronizados, de produção e de projetos.

Não há contas de nuvem, serviços externos, cobranças nem etapas administrativas. Não use `sudo`. Não use nomes reais, endereços de e-mail, credenciais nem arquivos de projetos existentes. O laboratório nunca altera sua configuração pessoal ou do sistema do Git e nunca acessa a rede.

No macOS, digitar `git` em um computador sem as ferramentas de desenvolvedor da Apple pode abrir uma janela de instalação. Trate isso como “o Git não está instalado”: feche a janela e pare até decidir como instalar o Git fora desta lição.

Execute os blocos em ordem e inspecione cada ponto de verificação. Não cole o módulo inteiro como se fosse um script: alguns comandos falham de propósito e a limpeza pede uma confirmação digitada. Pare diante de qualquer falha **inesperada**. A redação dos diagnósticos e o formato das saídas variam entre versões do Git; não trate uma mensagem específica como garantida.

### Versões do Git

| Categoria | Versão | Base |
| --- | --- | --- |
| Mínima suportada | Git 2.32.0 | Determinada a partir dos recursos que este laboratório exige, conferidos na documentação oficial do Git |
| Recomendada | A versão estável atual fornecida pelo fabricante do seu sistema operacional ou pelo projeto Git | O Git não tem canal de suporte de longo prazo; o projeto Git listava a 2.56.1 (2026-10-26) como a versão mais recente na data da revisão |
| Testada na prática | Nenhuma ainda | O laboratório não foi executado; as versões testadas serão registradas quando for |

| Recurso necessário | Primeira disponibilidade | Documentação inspecionada |
| --- | --- | --- |
| `git restore` | 2.23.0 | Notas de versão da 2.23.0. O manual classificou o comando como experimental até a 2.50.x; o rótulo está ausente do manual a partir da 2.51.0 |
| `git init --initial-branch` | 2.28.0 | Presente no manual do `git init` da 2.28.0, ausente no da 2.27.0 |
| `GIT_CONFIG_GLOBAL` | 2.32.0 | Notas de versão e manual da 2.32.0. **Isto define o mínimo** |
| `GIT_CONFIG_NOSYSTEM` | Antes da 2.32.0 | Documentado no manual da 2.32.0; a primeira versão em que apareceu não foi determinada e não afeta o mínimo |
| `GIT_TERMINAL_PROMPT` | 2.3.0 | Notas de versão da 2.3.0 |
| `git config --show-origin` | 2.8.0 | Notas de versão da 2.8.0 |

Não foi auditado para esta lição qual versão do Git cada distribuição Linux ou versão do macOS inclui. Verifique a sua própria instalação em vez de presumir. Uma versão igual ou superior ao mínimo é uma expectativa baseada em documentação, não uma garantia testada.

## Objetivos de aprendizagem

Ao final, você será capaz de:

- **O1 — Registrar:** criar um repositório local, explicar a árvore de trabalho (working tree), a área de preparação (staging area) e os commits, e registrar mudanças selecionadas preparando para o commit (stage) caminhos explícitos e escrevendo mensagens de commit descritivas.
- **O2 — Inspecionar:** inspecionar as mudanças da árvore de trabalho, as mudanças preparadas e o histórico de commits antes e depois de registrar, e prever o que um commit conterá com base nessa evidência.
- **O3 — Recuperar:** recuperar-se de uma preparação não intencional, de uma edição não registrada indesejada e de uma mudança registrada que precisa ser retirada, escolhendo a operação correspondente e dizendo o que cada uma não consegue recuperar.
- **O4 — Proteger:** manter segredos sintéticos fora de novos commits revisando o conteúdo preparado, e demonstrar que uma regra de ignorar não interrompe o rastreamento de um arquivo já registrado nem remove seu conteúdo do histórico.
- **O5 — Limpar:** verificar qual repositório um comando afetará, confirmar que nenhum remoto e nenhuma alteração na configuração pessoal ou do sistema do Git foram introduzidos, e remover apenas o laboratório descartável depois que suas verificações de segurança forem aprovadas.

## Conceitos fundamentais

### Um repositório é um diretório com um histórico registrado

Um **repositório** Git é um diretório comum, chamado de **árvore de trabalho** (working tree), mais um diretório oculto `.git`, no qual o Git guarda o histórico registrado e as configurações. `git init` cria esse diretório `.git`. Veja [git init](https://git-scm.com/docs/git-init).

O Git decide qual repositório um comando afeta procurando `.git` no seu diretório atual e, depois, em cada diretório pai. Isso importa para a segurança: se você executar um comando Git em um diretório comum que por acaso esteja dentro do projeto de alguém, o Git opera sobre esse projeto. `git rev-parse --show-toplevel` imprime o diretório de nível superior do repositório que seu comando afetaria, ou falha quando você não está dentro de um. Veja [git rev-parse](https://git-scm.com/docs/git-rev-parse). Neste laboratório, você o verifica antes de registrar qualquer coisa.

Um repositório colocado dentro da árvore de trabalho de outro repositório é chamado de aninhado e causa resultados confusos. Este laboratório evita isso: um diretório comum contém dois repositórios irmãos separados.

### Três lugares em que uma mudança pode estar

O Git distingue três lugares. Mantê-los separados explica quase todos os comandos desta lição.

| Lugar | O que contém | Como o conteúdo chega lá |
| --- | --- | --- |
| Árvore de trabalho (working tree) | Os arquivos que você vê e edita | Você cria ou edita arquivos |
| Área de preparação (staging area, também chamada de índice) | O conteúdo exato selecionado para o próximo commit | `git add <path>` copia para lá o conteúdo atual de um arquivo |
| Commits | Instantâneos registrados, cada um com mensagem, autor, data e um pai | `git commit` registra o que está na área de preparação |

Um arquivo que o Git foi instruído a acompanhar é **rastreado** (tracked); um arquivo que o Git apenas vê no diretório é **não rastreado** (untracked). Preparar um arquivo para o commit (stage) seleciona o *conteúdo naquele momento*, não um nome de arquivo: se você prepara um arquivo e depois o edita de novo, o commit contém a versão preparada, não a edição posterior.

Um **commit** é identificado por um ID hexadecimal longo; `git log --oneline` mostra uma forma curta. Os IDs dependem do conteúdo, do autor e do horário, então os seus serão diferentes dos de qualquer outra pessoa e de qualquer exemplo. `HEAD` indica o commit sobre o qual seu trabalho se apoia no momento. `HEAD~1` significa o commit anterior a ele e `HEAD~2`, o anterior a esse. Veja o [glossário do Git](https://git-scm.com/docs/gitglossary).

Aqui, a área de preparação é uma simplificação: o glossário descreve outros usos durante merges, que estão fora desta lição.

### Inspecione antes e depois de registrar

Cada pergunta tem seu próprio comando. Use o que responde ao que você precisa saber.

| Pergunta | Comando |
| --- | --- |
| O que está alterado, preparado ou não rastreado agora? | [`git status`](https://git-scm.com/docs/git-status) |
| O que eu alterei que **não** está preparado? | [`git diff`](https://git-scm.com/docs/git-diff) |
| O que exatamente o próximo commit registraria? | `git diff --staged` |
| Quais commits existem, do mais novo ao mais antigo? | [`git log --oneline`](https://git-scm.com/docs/git-log) |
| O que um commit alterou? | [`git show`](https://git-scm.com/docs/git-show) |
| Quais arquivos são rastreados? | [`git ls-files`](https://git-scm.com/docs/git-ls-files) |

Um diff marca as linhas adicionadas com `+` e as removidas com `-`. Um `git diff` vazio não significa que nada será registrado; significa apenas que a árvore de trabalho é igual à área de preparação. `git diff --staged` é a revisão que importa antes de um commit e é o controle de segurança deste módulo.

Prepare para o commit **caminhos explícitos**, como `git add ./service-notes.txt`. As formas que preparam tudo de uma vez selecionam por localização, não por decisão, e são o modo como rascunhos não relacionados e credenciais entram no histórico. Esta lição nunca as usa. Veja [git add](https://git-scm.com/docs/git-add).

Uma mensagem de commit diz o que mudou e por quê em uma linha curta, por exemplo `Add deployment checklist`. Mensagens como `update` ou `fix` obrigam a próxima pessoa a abrir o diff. Todo commit também registra o nome e o e-mail do autor. Em um repositório real, isso é informação pessoal; por isso este laboratório define uma identidade sintética que vale apenas para o repositório do laboratório. Veja [git commit](https://git-scm.com/docs/git-commit).

### A recuperação depende de onde está o erro

| Situação | Operação | O que ela altera | O que ela não consegue recuperar |
| --- | --- | --- | --- |
| Algo está preparado e não deveria estar | `git restore --staged <path>` | Somente a área de preparação; o arquivo na árvore de trabalho mantém seu conteúdo | Nada se perde. Ela não oculta conteúdo que já apareceu na tela nem o que já foi registrado em um commit |
| Um arquivo rastreado tem uma edição não registrada que você não quer | `git restore <path>` | Sobrescreve esse arquivo na árvore de trabalho com a versão preparada | **A edição descartada some.** Ela nunca foi registrada, então o Git não tem cópia dela |
| Um commit registrado precisa ser retirado | `git revert <commit>` | Adiciona um **novo** commit que aplica a mudança oposta | Ela não apaga o commit original, que continua no histórico com seu conteúdo |

`git restore <path>` é a única operação desta lição que destrói trabalho; por isso, indique um caminho explícito e inspecione antes o `git diff` desse caminho. Veja [git restore](https://git-scm.com/docs/git-restore).

O Git pode se recusar a reverter um commit quando mudanças pendentes em arquivos rastreados seriam sobrescritas, mas nem toda modificação pendente a bloqueia. Este laboratório aplica a regra mais conservadora: comece com uma árvore de trabalho limpa, sem mudanças pendentes em arquivos rastreados, para que o resultado da reversão seja fácil de interpretar. Normalmente o Git abre um editor para a mensagem; `--no-edit` aceita a mensagem gerada. Reverter um commit sobre o qual outros commits posteriores foram construídos pode produzir conflitos, que exigem habilidades além desta lição. Aqui você só reverte uma mudança pequena da qual nada depende. Veja [git revert](https://git-scm.com/docs/git-revert).

Comandos que descartam conjuntos inteiros de mudanças ou reescrevem commits existentes não são usados nem necessários neste módulo.

### Segredos e registros duráveis

Um **segredo** é uma informação cuja divulgação permite acesso ou outra ação sensível: uma senha, um token ou uma chave privada. Neste módulo, todo valor desse tipo é falso e começa com `SYNTHETIC-NOT-A-CREDENTIAL-`. Ele não autentica em nada. Nunca o substitua por um valor real.

Commits são duráveis e feitos para serem copiados. Depois que um repositório é compartilhado, cada cópia contém todos os commits registrados. Um segredo em um commit fica, portanto, legível para todas as pessoas que têm ou que venham a obter uma cópia, inclusive em commits antigos que nenhum arquivo atual mostra.

Duas consequências decorrem disso. Primeiro, a prevenção acontece no momento de preparar: leia `git diff --staged` e julgue o **conteúdo**, porque um arquivo chamado `deploy-summary.txt` pode conter um token tão facilmente quanto um chamado `secrets.env`. Segundo, se uma credencial real foi registrada ou compartilhada, apagá-la ou escondê-la não é a resposta. A resposta é avisar a pessoa responsável pela credencial e fazer com que ela seja revogada ou substituída pelo processo dela, para que o valor exposto deixe de funcionar. O [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) descreve a revogação como parte do ciclo de vida de um segredo. A orientação do GitHub sobre [remoção de dados sensíveis](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) também indica revogar ou trocar o segredo como primeiro passo e observa que reescrever o histórico tem efeitos colaterais e pode não ser justificável depois disso.

A revisão tem limites. Ela detecta o que você lê e reconhece; não detecta um formato de segredo que você não conhece, e tudo o que aparece em um terminal pode ficar guardado no histórico de rolagem ou em gravações.

### Regras de ignorar afetam apenas arquivos não rastreados

Um arquivo `.gitignore` lista padrões de arquivos que o Git deve deixar sem rastrear. Um arquivo não rastreado que corresponda a um padrão desaparece do `git status`, e `git add` o recusa quando ele é nomeado exatamente. Um padrão sem barra, como `local.env`, corresponde a esse nome em qualquer nível de diretório abaixo do arquivo. Veja [gitignore](https://git-scm.com/docs/gitignore).

A descrição oficial declara o limite diretamente: arquivos que já são rastreados não são afetados. Uma regra de ignorar adicionada depois que um arquivo foi registrado não muda nada sobre esse arquivo. O Git continua informando suas modificações e as registraria se fossem preparadas.

Três fatos separados são fáceis de misturar em uma única crença falsa:

1. **Ignorar** impede que um arquivo não rastreado seja preparado por acidente.
2. **Parar de rastrear** com `git rm --cached <path>` remove o arquivo da área de preparação e dos commits futuros, deixando sua cópia de trabalho no lugar. Veja [git rm](https://git-scm.com/docs/git-rm).
3. O **histórico** ainda contém todas as versões que já foram registradas. Nenhuma das duas primeiras ações muda isso.

[`git check-ignore -v <path>`](https://git-scm.com/docs/git-check-ignore) informa qual regra ignora um caminho. Por padrão, ele não informa nada para um arquivo rastreado, porque as regras de ignorar não se aplicam a ele. Esse silêncio é uma evidência que você usará.

Remover conteúdo de um histórico existente é uma operação especializada e disruptiva que este módulo não ensina, e ela não consegue recolher cópias que já existam em outros lugares.

### Escopos de configuração e isolamento do laboratório

O Git lê configurações de vários escopos: **system** (o computador inteiro), **global** (sua conta de usuário) e **local** (um repositório, guardado em seu `.git/config`). Veja [git config](https://git-scm.com/docs/git-config). Suas próprias configurações globais podem incluir sua identidade real, apelidos de comandos ou um arquivo pessoal de ignorar, e qualquer um deles poderia mudar o que este laboratório mostra.

Por isso, o laboratório inicia um shell filho com variáveis de ambiente que afetam apenas esse shell e os programas que ele inicia. Elas estão descritas na [referência de variáveis de ambiente do Git](https://git-scm.com/docs/git#_environment_variables):

| Configuração | Efeito no shell do laboratório |
| --- | --- |
| `GIT_CONFIG_GLOBAL=/dev/null` | O Git lê um arquivo vazio em vez da sua configuração global; seu arquivo não é lido nem alterado |
| `GIT_CONFIG_NOSYSTEM=1` | O Git ignora o arquivo de configuração de todo o sistema |
| `GIT_TERMINAL_PROMPT=0` | O Git não pede credenciais no terminal; nenhuma é necessária aqui |
| `GIT_PAGER=cat` | A saída é impressa diretamente em vez de abrir um paginador |
| `GIT_EDITOR=true` | Nenhum editor de texto é aberto. Um commit tentado sem `-m` recebe uma mensagem vazia e deve ser recusado |

As variáveis de ambiente também podem trabalhar contra o laboratório. Variáveis como `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME` e `GIT_COMMITTER_EMAIL` substituem a identidade guardada na configuração, então definir `user.name` e `user.email` não basta por si só. Outras acrescentam valores de configuração (`GIT_CONFIG_COUNT`), mudam o modelo usado por `git init` (`GIT_TEMPLATE_DIR`), apontam o Git para outro repositório (`GIT_DIR`), mudam como o Git procura um repositório nos diretórios pai (`GIT_CEILING_DIRECTORIES`, `GIT_DISCOVERY_ACROSS_FILESYSTEM`) ou alteram como as diferenças são exibidas (`GIT_EXTERNAL_DIFF`, `GIT_DIFF_OPTS`). A maioria dos shells não define nenhuma delas, mas um ambiente de desenvolvimento pode defini-las. Por isso, o shell do laboratório as remove com `unset` antes do primeiro comando Git. `unset` afeta apenas o shell do laboratório; remover uma variável que nunca foi definida é inofensivo. Depois, você confirma o resultado lendo a identidade registrada no seu primeiro commit.

Todas as configurações de identidade e de comportamento no laboratório usam `git config --local`. Uma delas, `core.excludesFile`, afasta os repositórios do laboratório de qualquer arquivo pessoal de ignorar, para que só as regras que você escrever estejam em vigor. Essas medidas tornam a lição previsível; elas não são um ambiente isolado de segurança (sandbox) e não protegem um segredo real.

## Recursos recomendados

Use-os de forma seletiva enquanto trabalha. Todos foram abertos e seu conteúdo relevante foi inspecionado em **2026-11-13**. Eles podem ser lidos gratuitamente e sem conta, e o laboratório não exige infraestrutura paga. As páginas de referência são o manual do projeto Git em git-scm.com, que mostrava a versão 2.56.1 como a mais recente na data da revisão; o manual instalado no seu computador (`git help <command>`) descreve a sua própria versão. Os recursos estão em inglês.

| Recurso e publicador | Leia para | Escopo e limites |
| --- | --- | --- |
| [What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F) — *Pro Git*, Scott Chacon e Ben Straub, publicado pelo site do projeto Git | A seção “The Three States”; O1 | Explicação de livro, não uma referência específica de versão. Indicado por link, não reproduzido |
| [Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository) — *Pro Git* | Status, preparação, diffs e arquivos ignorados; O1, O2, O4 | Também aborda atalhos que esta lição evita, como preparar tudo de uma vez |
| [Undoing Things](https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things) — *Pro Git* | As seções sobre `git restore`; O3 | Leia apenas as seções sobre restore; emendar commits e reset estão fora deste módulo |
| [git status](https://git-scm.com/docs/git-status), [git diff](https://git-scm.com/docs/git-diff), [git log](https://git-scm.com/docs/git-log), [git show](https://git-scm.com/docs/git-show), [git ls-files](https://git-scm.com/docs/git-ls-files) — manual do projeto Git | Comandos de inspeção; O2 | Referências completas, com muitas opções; só as formas usadas aqui são necessárias |
| [git add](https://git-scm.com/docs/git-add), [git commit](https://git-scm.com/docs/git-commit), [git restore](https://git-scm.com/docs/git-restore), [git revert](https://git-scm.com/docs/git-revert), [git rm](https://git-scm.com/docs/git-rm) — manual do projeto Git | Registro e recuperação; O1, O3, O4 | `git restore` tinha um rótulo de experimental nos manuais até a 2.50.x |
| [gitignore](https://git-scm.com/docs/gitignore) e [git check-ignore](https://git-scm.com/docs/git-check-ignore) — manual do projeto Git | Regras de padrão, o limite para arquivos rastreados e diagnóstico de regras; O4 | A sintaxe de padrões além de nomes exatos é opcional aqui |
| [git init](https://git-scm.com/docs/git-init), [git rev-parse](https://git-scm.com/docs/git-rev-parse), [git config](https://git-scm.com/docs/git-config), [variáveis de ambiente](https://git-scm.com/docs/git#_environment_variables) — manual do projeto Git | Limites do repositório, escopos e isolamento do laboratório; O5 | Somente as opções e variáveis listadas são usadas |
| [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — OWASP | A seção 2.7.3 sobre revogação; O4 | Orientação viva para organizações; a maior parte está além deste laboratório |
| [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) — GitHub | A afirmação de que revogar ou trocar vem primeiro e os efeitos colaterais de reescrever o histórico; O4 | Documentação de fornecedor sobre um serviço hospedado. Leia apenas as seções iniciais; **não execute o procedimento dela** |

As notas de versão do Git [2.23.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.23.0.adoc), [2.32.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.32.0.adoc), [2.3.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.3.0.adoc) e [2.8.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.8.0.adoc) foram inspecionadas como arquivos brutos do repositório de código-fonte do projeto Git para estabelecer a [tabela de versões](#versões-do-git). A primeira versão de `GIT_CONFIG_NOSYSTEM` e as versões do Git empacotadas por cada sistema operacional **não foram verificadas**. Revisar fontes é diferente de executar o exercício.

## Laboratórios práticos

### Praticar: registrar, inspecionar e recuperar mudanças de um serviço fictício

**Objetivo:** um histórico local de dez commits em `guided-repo` que você consiga explicar commit a commit, com uma credencial falsa mantida fora dos novos commits e evidências do que uma regra de ignorar faz e não faz. Objetivos de aprendizagem: O1–O5.

O layout do laboratório é um diretório comum contendo dois repositórios independentes. Nenhum dos repositórios contém o outro.

```text
git-change-management-lab/
  .lab-marker
  guided-repo/
  challenge-repo/
```

#### 1. Inicie o shell do laboratório e verifique o Git

Use a [orientação sobre diretório inicial](terminal-file-operations.md#encontre-um-diretório-inicial) do pré-requisito para entrar em um diretório local pessoal existente e confirme-o com `pwd -P`. Depois, inicie um shell filho com as configurações de isolamento explicadas em [Escopos de configuração e isolamento do laboratório](#escopos-de-configuração-e-isolamento-do-laboratório):

```sh
env ENV= HISTFILE= GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat GIT_EDITOR=true /bin/sh
```

Esses valores existem apenas nesse shell. Eles não editam nenhum arquivo de configuração. No novo shell, primeiro limpe as variáveis do Git herdadas do seu ambiente, pelos motivos dados na mesma seção de conceitos:

```sh
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_COMMON_DIR
unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_AUTHOR_DATE
unset GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL GIT_COMMITTER_DATE
unset GIT_CONFIG GIT_CONFIG_SYSTEM GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS GIT_TEMPLATE_DIR
unset GIT_EXTERNAL_DIFF GIT_DIFF_OPTS GIT_CEILING_DIRECTORIES GIT_DISCOVERY_ACROSS_FILESYSTEM
```

Estas linhas não imprimem nada. Depois, execute a verificação de versão. Ela é um auxiliar de segurança: lê o texto impresso por `git --version`, extrai os dois primeiros números e os compara com o mínimo. Você não precisa memorizar a sintaxe dela.

```sh
git_version_text=$(git --version)
git_version_number=${git_version_text#git version }
git_major=${git_version_number%%.*}
git_minor=${git_version_number#*.}
git_minor=${git_minor%%.*}
case "$git_major.$git_minor" in
  *[!0-9.]* | .* | *.)
    printf '%s\n' 'STOP: the Git version could not be determined. Git may not be installed.'
    ;;
  *)
    if test "$git_major" -gt 2 ||
       { test "$git_major" -eq 2 && test "$git_minor" -ge 32; }; then
      printf 'Git check passed: %s\n' "$git_version_text"
    else
      printf 'STOP: %s is older than the required 2.32.0.\n' "$git_version_text"
    fi
    ;;
esac
```

**Ponto de verificação:** a saída é `Git check passed:` seguida da sua versão. Registre essa versão nas suas anotações da avaliação. Guarde essas anotações **fora do diretório do laboratório**, em papel ou em um arquivo em outro diretório pessoal: a limpeza apaga tudo o que está dentro do laboratório, inclusive as anotações guardadas ali. Diante de qualquer uma das mensagens `STOP`, não continue: digite `exit` para sair do shell do laboratório. Instalar ou atualizar o Git é uma decisão sobre o seu próprio computador, tomada fora desta lição, com a orientação do seu sistema operacional ou da sua organização; nada aqui faz isso por você. Um Git anterior à 2.32.0 não reconhece `GIT_CONFIG_GLOBAL` e leria sua configuração pessoal apesar dessa definição, e é por isso que o laboratório se recusa a prosseguir.

#### 2. Crie o espaço de trabalho descartável

Primeiro, confirme que seu diretório atual **não** está dentro de um repositório:

```sh
git rev-parse --show-toplevel
printf 'Repository check status: %s\n' "$?"
```

**Falha esperada:** o Git informa que este diretório não é um repositório e o status é diferente de zero. Se um caminho for impresso, você está dentro de um repositório existente: **pare**, saia com `exit` e escolha outro diretório pai.

Agora crie o diretório do laboratório. `> /dev/null 2>&1` descarta tanto a saída normal quanto a de erro da verificação repetida, porque aqui só o status importa. O auxiliar registra dois caminhos somente depois que todas as etapas têm sucesso.

```sh
umask 077
set -C
unset git_lab_root git_lab_parent
if git rev-parse --git-dir > /dev/null 2>&1; then
  printf '%s\n' 'STOP: this directory is inside a Git repository. Choose another parent.'
elif git_lab_parent=$(pwd -P) &&
     mkdir ./git-change-management-lab &&
     cd ./git-change-management-lab &&
     git_lab_root=$(pwd -P) &&
     printf '%s\n' 'git-change-management-lab synthetic marker; not a secret' > ./.lab-marker; then
  printf 'Lab parent: %s\n' "$git_lab_parent"
  printf 'Lab root: %s\n' "$git_lab_root"
  ls -ld .
else
  unset git_lab_root git_lab_parent
  printf '%s\n' 'STOP: setup failed. Inspect before continuing.'
fi
```

**Ponto de verificação:** a raiz do laboratório termina em `/git-change-management-lab` e seu modo começa com `drwx------`. Registre os dois caminhos impressos de forma privada, nas suas anotações fora do diretório do laboratório; a retomada e a limpeza dependem deles, e um registro guardado dentro do laboratório não ajuda a encontrá-lo. `mkdir` sem `-p` recusa um nome existente. Não apague um diretório existente para abrir espaço: escolha outro diretório pai ou [retome seu próprio laboratório registrado](#retomar-uma-sessão-interrompida).

#### 3. Inicialize e verifique o primeiro repositório

Crie `guided-repo` como um diretório novo, inicialize-o e confirme que o nível superior do repositório, segundo o Git, é exatamente o diretório que você espera.

```sh
if test -n "$git_lab_root" &&
   test "$(pwd -P)" = "$git_lab_root" &&
   mkdir ./guided-repo &&
   cd ./guided-repo &&
   git init --initial-branch=main &&
   test "$(git rev-parse --show-toplevel)" = "$git_lab_root/guided-repo" &&
   git config --local user.name 'Lab Learner' &&
   git config --local user.email 'learner@example.invalid' &&
   git config --local core.excludesFile /dev/null; then
  printf '%s\n' 'Repository boundary verified and configured: guided-repo'
else
  printf '%s\n' 'STOP: repository setup failed. Do not configure or record anything.'
fi
```

`--initial-branch=main` dá um nome previsível à única linha de histórico. Você não criará nem trocará de branch neste módulo.

As três linhas `git config --local` definem a identidade sintética e a configuração de ignorar exclusiva do laboratório. Elas ficam dentro da cadeia protegida de propósito: uma configuração local é gravada em qualquer repositório que o Git encontre a partir do diretório atual, então nada é gravado a menos que se tenha acabado de confirmar que o nível superior é `guided-repo`, dentro do seu laboratório. Diante de `STOP`, não execute as linhas de configuração manualmente; inspecione com `pwd -P` e `ls -a` e depois use a [orientação de retomada](#retomar-uma-sessão-interrompida).

Depois da mensagem de sucesso, inspecione o resultado. Estes comandos apenas leem:

```sh
git config --list --show-origin
git remote -v
git status
```

**Ponto de verificação:** toda linha da listagem de configuração começa com `file:.git/config`, mostrando que somente as configurações locais deste repositório estão em vigor. `git remote -v` não imprime nada: este repositório não tem conexão com nenhum outro. `git status` informa que ainda não há commits e nada a registrar. Se a listagem mostrar qualquer outra origem, ou uma identidade que não seja a sintética, pare e inspecione; não ajuste configurações fora deste repositório.

`example.invalid` é um nome reservado que não pode pertencer a uma caixa de correio real. Todo comando daqui até o passo 12 é executado dentro de `guided-repo`. Se você tiver alguma dúvida, execute `git rev-parse --show-toplevel` e compare com a raiz do laboratório que registrou.

#### 4. Registre as primeiras mudanças

Crie dois arquivos sintéticos e observe a árvore de trabalho:

```sh
printf '%s\n' 'service=demo-service' 'owner=platform-training' > ./service-notes.txt
printf '%s\n' 'step-1=review-notes' 'step-2=record-change' > ./deploy-checklist.txt
git status
```

**Ponto de verificação:** os dois arquivos aparecem como não rastreados. Nada está preparado.

Selecione apenas as anotações, revise a seleção e registre-a:

```sh
git add ./service-notes.txt
git status
git diff --staged
```

**Ponto de verificação:** `service-notes.txt` aparece como uma mudança a ser registrada; `deploy-checklist.txt` continua não rastreado. O diff preparado mostra exatamente duas linhas adicionadas. Diga em qual dos [três lugares](#três-lugares-em-que-uma-mudança-pode-estar) cada arquivo está antes de continuar.

```sh
git commit -m 'Add demo service notes'
git log --oneline
git log -1 --format='author: %an <%ae> | committer: %cn <%ce>'
git status
```

**Ponto de verificação:** o log mostra um commit com a sua mensagem. Dependendo da versão e da configuração do seu Git, `git log --oneline` também pode mostrar decorações opcionais, como `(HEAD -> main)`, depois do ID curto, e o nome do branch pode ser diferente; compare a mensagem do commit e a ordem, não a formatação exata. A linha formatada mostra `Lab Learner <learner@example.invalid>` como autor e como committer (quem registrou o commit). Se qualquer um dos dois mostrar outra identidade, algo no seu ambiente está sobrescrevendo as configurações do laboratório: **pare**, não faça mais commits e use a [limpeza](#limpeza-após-a-avaliação) antes de começar de novo em um shell de laboratório novo. A lista de verificação continua não rastreada: um commit registra a área de preparação, não o diretório inteiro.

Registre a lista de verificação como um commit próprio, revisando-a antes:

```sh
git add ./deploy-checklist.txt
git diff --staged
git commit -m 'Add deployment checklist'
git log --oneline
git status
```

**Ponto de verificação:** dois commits, do mais novo ao mais antigo. `git status` agora informa uma árvore de trabalho limpa.

#### 5. Inspecione uma mudança antes e depois de registrá-la

Acrescente uma linha a um arquivo rastreado e compare os dois diffs em cada etapa:

```sh
printf '%s\n' 'status=ready-for-review' >> ./service-notes.txt
git status
git diff
git diff --staged
```

**Ponto de verificação:** `git diff` mostra uma linha adicionada; `git diff --staged` não imprime nada, porque nada foi selecionado ainda.

```sh
git add ./service-notes.txt
git diff
git diff --staged
```

**Ponto de verificação:** os resultados se invertem. `git diff` agora está vazio e `git diff --staged` mostra a linha adicionada. Explique por que um `git diff` vazio neste momento não significa “nada será registrado”.

```sh
git commit -m 'Mark service notes ready for review'
git log --oneline
git show --stat HEAD
git show HEAD
```

**Ponto de verificação:** três commits. `git show --stat HEAD` nomeia um arquivo alterado; `git show HEAD` mostra o autor como a identidade sintética e a única linha adicionada. Agora você inspecionou a mesma mudança antes de preparar, depois de preparar e depois de registrar.

#### 6. Detecte e remova da preparação um segredo sintético

Um arquivo de configurações locais com um token falso aparece ao lado de uma mudança legítima na lista de verificação. Um colega sugere preparar os dois arquivos pendentes juntos.

```sh
printf '%s\n' 'api_token=SYNTHETIC-NOT-A-CREDENTIAL-GUIDED' > ./local.env
printf '%s\n' 'step-3=inspect-staged-changes' >> ./deploy-checklist.txt
git add ./deploy-checklist.txt ./local.env
git status
git diff --staged --name-only
git diff --staged
```

**Ponto de verificação — este é o erro intencional:** dois caminhos estão preparados e o diff preparado mostra a linha contendo `SYNTHETIC-NOT-A-CREDENTIAL-GUIDED`. A revisão o detectou **antes** de existir um commit. Observe o que a revisão não conseguiu impedir: o valor agora foi impresso na sua tela. Com um segredo real, isso por si só pode importar.

Remova da área de preparação somente esse arquivo e verifique:

```sh
git restore --staged ./local.env
git status
git diff --staged --name-only
cat ./local.env
```

**Ponto de verificação:** somente `deploy-checklist.txt` continua preparado; `local.env` voltou a ser não rastreado e seu conteúdo não mudou. Remover o arquivo da preparação alterou a área de preparação, não o arquivo em si. Esta lição não verifica quando o Git descarta a cópia interna que fez enquanto o arquivo estava preparado; essa cópia não faz parte de nenhum commit.

Revise mais uma vez e registre a mudança legítima:

```sh
git diff --staged
git commit -m 'Add staged-change review step to checklist'
git log --oneline
```

**Ponto de verificação:** quatro commits. O diff preparado que você revisou continha uma linha adicionada à lista de verificação e nenhum token.

#### 7. Adicione uma regra de ignorar

`local.env` ainda é não rastreado e seria oferecido de novo a cada `git status`. Diga ao Git para deixá-lo sem rastrear:

```sh
printf '%s\n' 'local.env' > ./.gitignore
git status
git check-ignore -v ./local.env
printf 'check-ignore status: %s\n' "$?"
```

**Ponto de verificação:** `git status` lista `.gitignore` como não rastreado e não lista mais `local.env`. `git check-ignore -v` indica o arquivo, o número da linha e o padrão da regra, com status `0`.

Agora confirme que a regra protege contra a preparação do arquivo pelo nome exato:

```sh
git add ./local.env
printf 'Add status: %s\n' "$?"
git diff --staged --name-only
```

**Recusa esperada:** o Git informa que o caminho é ignorado, o status é diferente de zero e nada é preparado. A mensagem do Git menciona uma opção que anula a regra. Não a use; a recusa é o controle funcionando.

A própria regra é um arquivo do projeto que vale a pena registrar:

```sh
git add ./.gitignore
git diff --staged
git commit -m 'Ignore local settings file'
git log --oneline
```

**Ponto de verificação:** cinco commits. O diff preparado mostrou uma linha adicionada em `.gitignore`.

#### 8. Diagnostique uma regra de ignorar que parece não funcionar

Este passo cria uma falha de propósito. Imagine que um arquivo de configurações com um token falso foi registrado há algum tempo, antes de alguém pensar em regras de ignorar. Reproduza esse histórico. A mensagem do commit o identifica como um erro do laboratório:

```sh
printf '%s\n' 'service=demo-service' 'legacy_token=SYNTHETIC-NOT-A-CREDENTIAL-LEGACY' > ./legacy.env
git add ./legacy.env
git diff --staged
git commit -m 'Add legacy settings (intentional lab mistake)'
```

Mais tarde, alguém adiciona uma regra de ignorar e informa que o problema foi resolvido:

```sh
printf '%s\n' 'legacy.env' >> ./.gitignore
git add ./.gitignore
git diff --staged
git commit -m 'Ignore legacy settings file'
git log --oneline
```

**Ponto de verificação:** sete commits. Antes de executar o próximo bloco, **preveja**: se `legacy.env` mudar agora, o Git vai perceber?

```sh
printf '%s\n' 'note=changed-after-ignore-rule' >> ./legacy.env
git status
git ls-files
git check-ignore -v ./legacy.env
printf 'check-ignore status: %s\n' "$?"
```

**Resultado esperado, contrário ao que foi relatado:** `git status` lista `legacy.env` como modificado. `git ls-files` o inclui, então ele é rastreado. `git check-ignore` não imprime nada e retorna o status `1`, embora `.gitignore` contenha uma linha correspondente.

Declare seu diagnóstico antes de continuar a leitura. Compare com o passo 7: o mesmo tipo de regra escondeu `local.env`, que era não rastreado. `legacy.env` já era rastreado quando sua regra foi adicionada, e as regras de ignorar não se aplicam a arquivos rastreados. A regra não falhou; ela nunca se aplicou.

#### 9. Pare de rastrear o arquivo e inspecione seu histórico

Remova o arquivo da área de preparação mantendo sua cópia de trabalho. `--cached` limita a operação à área de preparação:

```sh
git rm --cached ./legacy.env
git status
git diff --staged --stat
git commit -m 'Stop tracking legacy settings file'
```

**Ponto de verificação:** antes do commit, `git status` mostra `legacy.env` como uma exclusão preparada, e o arquivo não é oferecido como não rastreado porque a regra de ignorar agora se aplica a ele.

Verifique o estado atual:

```sh
git ls-files
ls -a .
git check-ignore -v ./legacy.env
printf 'check-ignore status: %s\n' "$?"
```

**Ponto de verificação:** `git ls-files` não lista mais `legacy.env`. `ls -a` mostra que o arquivo ainda está no seu diretório. `git check-ignore` agora informa a regra, com status `0`. Os novos commits não incluirão este arquivo.

Agora faça a pergunta que o relato ignorou: o conteúdo registrado sumiu?

```sh
git log --oneline -- ./legacy.env
git show HEAD~1:legacy.env
```

**Resultado esperado:** o log lista dois commits que tocaram o caminho: o que o adicionou e o que parou de rastreá-lo. `git show HEAD~1:legacy.env` imprime o arquivo como foi registrado um commit antes do atual, inclusive a linha com `SYNTHETIC-NOT-A-CREDENTIAL-LEGACY`. `<commit>:<path>` lê um arquivo de um instantâneo registrado; o caminho é dado a partir do nível superior do repositório.

**Esta é a evidência central do módulo.** A regra de ignorar não interrompeu o rastreamento. Parar de rastrear não removeu o histórico. Qualquer pessoa que tenha uma cópia deste repositório poderia executar o mesmo comando. Para uma credencial real, nenhum destes passos a tornaria segura: a pessoa responsável precisa revogá-la ou substituí-la. Nada mais é feito com o histórico aqui.

#### 10. Descarte uma edição não registrada indesejada

Faça uma edição acidental em um arquivo rastreado e inspecione-a:

```sh
printf '%s\n' 'status=accidental-edit' >> ./service-notes.txt
git status
git diff ./service-notes.txt
```

**Ponto de verificação:** uma linha adicionada em um arquivo. Confirme que essa é a única mudança que você está prestes a descartar. O próximo comando sobrescreve a cópia de trabalho desse único caminho com a versão preparada. **A linha descartada não pode ser recuperada pelo Git**, porque nunca foi registrada em um commit.

```sh
git restore ./service-notes.txt
git status
git diff
cat ./service-notes.txt
```

**Ponto de verificação:** a árvore de trabalho está limpa, `git diff` não imprime nada e as anotações têm as três linhas registradas. Compare com o passo 6: `--staged` alterou apenas a área de preparação e não perdeu nada; sem ele, o mesmo comando alterou seu arquivo e perdeu a edição.

#### 11. Retire uma mudança registrada revertendo-a

Registre uma pequena mudança que vai se revelar errada:

```sh
printf '%s\n' 'step-4=skip-review-when-busy' >> ./deploy-checklist.txt
git diff
git add ./deploy-checklist.txt
git diff --staged
git commit -m 'Add shortcut step to checklist'
git log --oneline
```

**Ponto de verificação:** nove commits. Uma pessoa revisora rejeita o atalho. A mudança já está registrada, então as duas operações de recuperação anteriores não se aplicam. Confirme que não há mudanças pendentes e depois adicione um commit que aplica a mudança oposta:

```sh
git status
git revert --no-edit HEAD
git log --oneline
cat ./deploy-checklist.txt
git show --stat HEAD
```

**Ponto de verificação:** dez commits. A mensagem mais recente começa com `Revert` e cita a mensagem rejeitada. A lista de verificação voltou a ter três passos. Tanto o commit rejeitado quanto a sua reversão continuam visíveis no log.

Verifique que o conteúdo registrado agora é igual ao de antes do commit rejeitado. `--exit-code` faz o `git diff` informar diferenças por meio do seu status:

```sh
git diff --exit-code HEAD~2 HEAD
printf 'Comparison status: %s\n' "$?"
```

**Ponto de verificação:** nenhuma saída e status `0`. Explique por que uma reversão não seria uma resposta ao token do passo 9: ela adiciona um commit, e o commit anterior com o token continuaria lá.

Se `git status` algum dia informar que uma reversão está em andamento, algo inesperado aconteceu. Execute `git revert --abort` para voltar ao estado anterior à reversão e inspecione antes de tentar de novo.

#### 12. Verifique os limites e mantenha o espaço de trabalho

```sh
git rev-parse --show-toplevel
git remote -v
git config --list --show-origin
git ls-files
git log --oneline
```

**Ponto de verificação:** o nível superior é a raiz do laboratório que você registrou seguida de `/guided-repo`. Não há remoto. Toda linha de configuração ainda se origina de `file:.git/config`. Três arquivos são rastreados: `.gitignore`, `deploy-checklist.txt` e `service-notes.txt`. O histórico tem estas dez mensagens, da mais nova para a mais antiga:

```text
Revert "Add shortcut step to checklist"
Add shortcut step to checklist
Stop tracking legacy settings file
Ignore legacy settings file
Add legacy settings (intentional lab mistake)
Ignore local settings file
Add staged-change review step to checklist
Mark service notes ready for review
Add deployment checklist
Add demo service notes
```

Cada linha da sua saída é precedida por um ID curto de commit que difere do de qualquer outra pessoa.

Mantenha o mesmo shell e o mesmo espaço de trabalho. Continue para o [desafio independente](#desafios-práticos), responda às [perguntas](#perguntas) e revise os [critérios de conclusão](#critérios-de-conclusão) enquanto os dois repositórios ainda existem. Depois, faça a [limpeza](#limpeza-após-a-avaliação). Você pode limpar uma tentativa incompleta a qualquer momento; isso não estabelece a conclusão.

#### Retomar uma sessão interrompida

Não execute novamente a configuração, `git init` nem qualquer bloco que cria arquivos ou commits sobre um laboratório existente. Repetir um acréscimo adiciona uma linha duplicada; repetir um bloco de commit registra um segundo commit.

Se o shell do laboratório ainda estiver aberto e `git_lab_root` estiver definida, volte com `cd "$git_lab_root"` e inspecione. Se o shell foi fechado, inicie um novo com o comando `env ... /bin/sh` do [passo 1](#1-inicie-o-shell-do-laboratório-e-verifique-o-git) e **execute novamente suas linhas `unset` e o bloco de verificação de versão**, porque as configurações de isolamento pertencem ao shell, não ao diretório do laboratório. O bloco de restauração abaixo repete as linhas `unset` como salvaguarda. Não aninhe shells sem necessidade.

Depois, substitua o texto de exemplo entre aspas pela **raiz exata do laboratório que você registrou**. O texto de exemplo é deliberadamente inutilizável. Se não conseguir identificar seu laboratório, pare em vez de adivinhar.

O bloco primeiro confirma que as configurações de isolamento estão ativas neste shell: `GIT_CONFIG_GLOBAL` deve ser `/dev/null` e `GIT_CONFIG_NOSYSTEM` deve ser `1`. Se qualquer uma for diferente, ele para antes de mudar de diretório. Isso significa que você está em um shell comum, no qual o Git usaria sua configuração e sua identidade pessoais. Não defina as variáveis manualmente; inicie o shell do laboratório com o comando `env ... /bin/sh` do passo 1 e volte aqui.

```sh
unset git_lab_root git_lab_parent
if test "$GIT_CONFIG_GLOBAL" != /dev/null ||
   test "$GIT_CONFIG_NOSYSTEM" != 1; then
  printf '%s\n' 'STOP: this shell does not have the lab isolation settings.'
  printf '%s\n' 'Git would read your personal configuration here. Start the lab shell from step 1.'
elif cd '/replace-with-your-recorded-path/git-change-management-lab' &&
   git_lab_root=$(pwd -P) &&
   test -f ./.lab-marker &&
   git_lab_parent=$(cd .. && pwd -P); then
  umask 077
  set -C
  unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_COMMON_DIR
  unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_AUTHOR_DATE
  unset GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL GIT_COMMITTER_DATE
  unset GIT_CONFIG GIT_CONFIG_SYSTEM GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS GIT_TEMPLATE_DIR
  unset GIT_EXTERNAL_DIFF GIT_DIFF_OPTS GIT_CEILING_DIRECTORIES GIT_DISCOVERY_ACROSS_FILESYSTEM
  printf 'Resumed lab root: %s\n' "$git_lab_root"
  printf 'Lab parent: %s\n' "$git_lab_parent"
  ls -a .
else
  unset git_lab_root git_lab_parent
  printf '%s\n' 'STOP: the recorded lab could not be opened.'
fi
```

Compare os dois caminhos com seus registros e confirme que as entradas são as que você criou. Entre no repositório em que estava trabalhando com `cd ./guided-repo` ou `cd ./challenge-repo` e execute `git rev-parse --show-toplevel`, `git status` e `git log --oneline`. O próprio registro do Git mostra onde você parou.

| Estado que você observa | Próxima ação segura |
| --- | --- |
| O diretório do repositório existe, mas `git rev-parse --show-toplevel` falha ou imprime um caminho diferente | A inicialização não foi concluída. Pare e inspecione com `ls -a`. Se o diretório estiver vazio, remova-o pelo nome com `rmdir` a partir da raiz do laboratório e repita o passo 3 |
| O nível superior está correto, mas a identidade não é a sintética | Somente depois de `git rev-parse --show-toplevel` imprimir o repositório esperado dentro do seu laboratório, execute `git config --local user.name 'Lab Learner'` e `git config --local user.email 'learner@example.invalid'`, além de `git config --local core.excludesFile /dev/null` se essa configuração estiver ausente. Depois, inspecione a listagem |
| Há menos commits do que um passo espera | Compare o log com a lista do passo 12 e continue a partir da primeira mensagem ausente. Inspecione os arquivos antes de acrescentar algo; não acrescente uma linha que já esteja presente |
| Há mudanças preparadas, mas não registradas | Leia `git diff --staged`. Faça o commit somente se corresponder ao passo em que você estava; caso contrário, remova o caminho da área de preparação com `git restore --staged <path>` e refaça a revisão desse passo |
| Um arquivo rastreado tem uma edição que você não reconhece | Inspecione-a com `git diff <path>`. Decida, pelo conteúdo, se ela pertence ao passo atual antes de descartar qualquer coisa |
| `git status` informa uma reversão em andamento | Execute `git revert --abort`, confirme que o status está limpo e refaça o passo 11 a partir da linha `git status` |
| O repositório do desafio já existe | Inspecione o status e o log. Não execute novamente o bloco de configuração dele; continue a partir do primeiro requisito inacabado |
| Você não consegue estabelecer um estado confiável | Use a [limpeza](#limpeza-após-a-avaliação) e comece um laboratório novo. Não invente evidências para passos que você não consegue mostrar |

Retomar restaura a sessão. Isso não estabelece que algum critério foi atendido; repita qualquer observação que você não tenha guardado.

#### Limpeza após a avaliação

Revise primeiro suas evidências e confirme que as anotações que você quer guardar estão fora do diretório do laboratório: este procedimento apaga permanentemente tudo o que está dentro dele. Use esta seção depois do [desafio](#desafios-práticos), das [perguntas](#perguntas) e dos [critérios de conclusão](#critérios-de-conclusão), ou para abandonar uma tentativa incompleta.

**Por que esta limpeza difere dos outros módulos de Fundamentos.** Aqueles módulos removem cada arquivo pelo nome e nunca apagam de forma recursiva. Isso não é prático aqui: o Git guarda o histórico como muitos arquivos internos sob `.git`, com nomes que você não escolheu e sem permissão de escrita. Por isso, este módulo permite **uma** remoção recursiva e forçada de todo o diretório descartável do laboratório, cercada de verificações. A exceção vale apenas para este laboratório. Não é uma técnica geral: a remoção recursiva é permanente, não tem como ser desfeita e apaga tudo o que está abaixo do alvo.

O procedimento tem duas ações deliberadas. A primeira apenas inspeciona. A segunda remove, e só depois que você digita o nome do diretório. Nada na configuração a executa por você.

**Ação 1 — verificar.** O auxiliar exige primeiro as configurações de isolamento do laboratório (`GIT_CONFIG_GLOBAL` é `/dev/null` e `GIT_CONFIG_NOSYSTEM` é `1`), porque suas verificações de identidade executam o Git e não podem ser influenciadas pela sua configuração pessoal. Se essa verificação parar, nada foi inspecionado nem removido: inicie o shell do laboratório a partir do passo 1, use o [procedimento de retomada](#retomar-uma-sessão-interrompida) e verifique novamente. Em seguida, ele vai para o diretório pai do laboratório e exige tudo o que segue: os dois caminhos registrados estão definidos e são consistentes; o laboratório não é o seu diretório pessoal; o laboratório é um diretório de verdade, não um link simbólico; ele contém o arquivo marcador criado no passo 2; sua localização física é igual ao caminho registrado; e o diretório pai não está dentro de nenhum repositório Git. Cada repositório que existir deve então provar sua identidade: seu nível superior está dentro do laboratório, ele usa a identidade sintética e não tem remoto. `for ... do ... done` repete as mesmas verificações para os dois nomes de repositório.

```sh
unset cleanup_verified_root
if test "$GIT_CONFIG_GLOBAL" != /dev/null ||
   test "$GIT_CONFIG_NOSYSTEM" != 1; then
  printf '%s\n' 'STOP: this shell does not have the lab isolation settings.'
  printf '%s\n' 'Git would read your personal configuration here. Start the lab shell from step 1.'
elif test -n "$git_lab_root" &&
   test -n "$git_lab_parent" &&
   test "$git_lab_root" = "$git_lab_parent/git-change-management-lab" &&
   test "$git_lab_root" != "$HOME" &&
   cd "$git_lab_parent" &&
   test "$(pwd -P)" = "$git_lab_parent" &&
   test -d ./git-change-management-lab &&
   test ! -L ./git-change-management-lab &&
   test -f ./git-change-management-lab/.lab-marker &&
   test ! -L ./git-change-management-lab/.lab-marker &&
   test "$(cd ./git-change-management-lab && pwd -P)" = "$git_lab_root" &&
   ! git rev-parse --git-dir > /dev/null 2>&1; then
  cleanup_verified_root=$git_lab_root
  for lab_repo in guided-repo challenge-repo; do
    if test ! -e "./git-change-management-lab/$lab_repo"; then
      printf 'Not present: %s\n' "$lab_repo"
    elif test ! -L "./git-change-management-lab/$lab_repo" &&
         test "$(git -C "./git-change-management-lab/$lab_repo" rev-parse --show-toplevel)" = "$git_lab_root/$lab_repo" &&
         test "$(git -C "./git-change-management-lab/$lab_repo" config --local user.email)" = 'learner@example.invalid' &&
         test -z "$(git -C "./git-change-management-lab/$lab_repo" remote)"; then
      printf 'Verified lab repository: %s\n' "$lab_repo"
    else
      unset cleanup_verified_root
      printf 'STOP: %s failed its identity checks.\n' "$lab_repo"
    fi
  done
  printf '%s\n' 'Top-level entries:'
  ls -a ./git-change-management-lab
  printf '%s\n' 'Symbolic links inside the lab (expected: none listed):'
  find ./git-change-management-lab -type l
else
  printf '%s\n' 'STOP: workspace verification failed. Do not remove anything.'
fi
if test -n "$cleanup_verified_root"; then
  printf 'Verification passed for: %s\n' "$cleanup_verified_root"
else
  printf '%s\n' 'Verification did NOT pass. Inspect manually.'
fi
```

**Ponto de verificação — inspecione antes de decidir.** Continue somente se **todas** estas condições forem verdadeiras:

- A última linha é `Verification passed for:` seguida da raiz do laboratório que você registrou, e nenhuma linha `STOP` aparece.
- As entradas de nível superior são apenas `.`, `..`, `.lab-marker`, `guided-repo`, `challenge-repo` (se você a criou) e arquivos que você reconhece como seus. Qualquer um deles será apagado.
- Nenhum link simbólico é listado.
- O caminho não é o seu diretório pessoal, nem um projeto, nem um diretório de que você precise.

Se qualquer verificação for inconclusiva, **pare e inspecione manualmente.** Não edite o auxiliar para fazê-lo passar, não digite o comando de remoção manualmente e não amplie o alvo dele. Um diretório de repositório deixado vazio por uma configuração que falhou pode ser removido pelo nome com `rmdir` a partir da raiz do laboratório; só então você pode verificar novamente. Se não conseguir explicar uma discrepância, deixe o diretório no lugar e peça ajuda. Um laboratório não removido é um problema pequeno; uma remoção errada, não.

**Ação 2 — remover.** Execute isto somente depois do ponto de verificação acima. Ele repete as verificações essenciais, inclusive que o arquivo marcador ainda existe como arquivo regular e não como link simbólico, e então pede que você digite o nome do diretório. O comando de remoção nomeia um diretório fixo e literal, relativo ao diretório pai verificado. Ele nunca recebe um caminho de uma variável, então uma variável vazia ou alterada não consegue redirecioná-lo.

```sh
if test -n "$cleanup_verified_root" &&
   test "$cleanup_verified_root" = "$git_lab_root" &&
   test "$(pwd -P)" = "$git_lab_parent" &&
   test -d ./git-change-management-lab &&
   test ! -L ./git-change-management-lab &&
   test -f ./git-change-management-lab/.lab-marker &&
   test ! -L ./git-change-management-lab/.lab-marker &&
   test "$(cd ./git-change-management-lab && pwd -P)" = "$cleanup_verified_root"; then
  printf '%s' 'Type the lab directory name to confirm permanent removal: '
  cleanup_answer=
  if IFS= read -r cleanup_answer &&
     test "$cleanup_answer" = 'git-change-management-lab'; then
    if rm -rf ./git-change-management-lab &&
       test ! -e ./git-change-management-lab; then
      unset cleanup_verified_root git_lab_root
      printf '%s\n' 'Lab directory removed.'
    else
      printf '%s\n' 'STOP: removal is incomplete. Inspect before retrying.'
    fi
  else
    printf '%s\n' 'Cleanup cancelled. Nothing was removed.'
  fi
else
  printf '%s\n' 'STOP: verification is missing or stale. Run the verification action again.'
fi
```

`rm -r` remove um diretório e tudo o que está abaixo dele; `-f` suprime as perguntas por arquivo que os arquivos internos somente leitura do Git provocariam. O comando remove o próprio link simbólico em vez do que ele aponta, e as verificações acima já se recusam a prosseguir quando o diretório do laboratório é um link. `IFS= read -r` mantém a linha digitada exatamente como foi inserida, inclusive espaços ou tabulações no início ou no fim, e um `read` que falha (por exemplo, fim da entrada) também cancela. Digitar qualquer coisa que não seja o nome exato, inclusive o nome com espaços em volta, ou uma linha vazia, cancela.

**Ponto de verificação:** `Lab directory removed.` só aparece depois que a remoção teve sucesso e o caminho deixou de existir. Seu diretório atual é o diretório pai, que nunca foi alvo de remoção. Digite `exit` para sair do shell do laboratório; as configurações de isolamento terminam com ele e a sua própria configuração do Git nunca foi alterada. Diante de qualquer `STOP`, o shell continua aberto: execute `pwd -P` e `ls -a` e repita a ação de verificação em vez de improvisar.

A remoção não é um apagamento seguro e não afeta backups nem gravações do terminal. Com dados sintéticos, isso não importa. Registre a observação da limpeza e depois conclua o O5 nos [critérios de conclusão](#critérios-de-conclusão).

## Desafios práticos

### Construir: decidir o que pertence ao registro

Um colega fictício passa a você, em uma entrega (handoff, a passagem de um trabalho em andamento de uma pessoa para outra), um segundo repositório do `demo-service` no meio do trabalho. Várias mudanças estão pendentes. O pedido é “faça o commit da correção do health-check”, seguido do comentário: “O arquivo de configurações do cache tem uma chave, mas tudo bem, ele está no `.gitignore`.”

Decida o que pertence ao registro, mantenha credenciais falsas fora dos novos commits, teste a afirmação do colega com evidências e execute duas recuperações. Nenhuma receita de comandos é fornecida. Use apenas o que você praticou, em uma ordem que você escolha e consiga justificar.

O bloco a seguir **fornece o estado inicial**; ele não faz parte da solução. Execute-o uma vez no shell do laboratório. Ele volta à raiz do laboratório, cria `challenge-repo` ao lado de `guided-repo`, verifica seu limite e constrói dois commits mais quatro mudanças pendentes.

```sh
if test -n "$git_lab_root" &&
   cd "$git_lab_root" &&
   test "$(pwd -P)" = "$git_lab_root" &&
   mkdir ./challenge-repo &&
   cd ./challenge-repo &&
   git init --initial-branch=main &&
   test "$(git rev-parse --show-toplevel)" = "$git_lab_root/challenge-repo" &&
   git config --local user.name 'Lab Learner' &&
   git config --local user.email 'learner@example.invalid' &&
   git config --local core.excludesFile /dev/null &&
   printf '%s\n' 'service=demo-service' 'release=1.4.0' 'status=draft' > ./release-notes.txt &&
   printf '%s\n' 'step-1=announce-rollback' 'step-2=restore-previous-release' > ./rollback-plan.txt &&
   printf '%s\n' 'cache_ttl=300' 'upstream_key=SYNTHETIC-NOT-A-CREDENTIAL-CHALLENGE-OLD' > ./cache-settings.conf &&
   git add ./release-notes.txt ./rollback-plan.txt ./cache-settings.conf &&
   git commit -m 'Import demo service release files' &&
   printf '%s\n' 'cache-settings.conf' > ./.gitignore &&
   git add ./.gitignore &&
   git commit -m 'Ignore cache settings' &&
   printf '%s\n' 'fix=correct-health-check-path' >> ./release-notes.txt &&
   printf '%s\n' 'draft=unfinished-onboarding-ideas' > ./onboarding-draft.txt &&
   printf '%s\n' 'service=demo-service' 'result=pending' 'debug_context=SYNTHETIC-NOT-A-CREDENTIAL-CHALLENGE-NEW' > ./deploy-summary.txt &&
   printf '%s\n' 'cache_ttl_note=tuned-locally' >> ./cache-settings.conf; then
  printf '%s\n' 'Challenge repository is ready.'
  git status
else
  printf '%s\n' 'STOP: challenge setup failed. Inspect before continuing.'
fi
```

**Ponto de verificação de entrada:** a mensagem `Challenge repository is ready.` aparece, seguida de uma listagem de status. Se a configuração parar no meio, inspecione com `git status` e `git log --oneline`; não execute o bloco novamente sobre um `challenge-repo` existente. Todos os valores são falsos.

Apresente estes resultados:

1. **Inspecione (O2).** Antes de preparar qualquer coisa, descreva o repositório: quais commits existem e o que cada um alterou, quais arquivos são rastreados e o que é cada uma das quatro mudanças pendentes. Baseie cada afirmação na saída de um comando e leia o *conteúdo* de cada mudança pendente, não apenas o nome.
2. **Registre (O1).** Registre a correção do health-check como um commit próprio, com uma mensagem descritiva. Mostre a revisão da área de preparação que você fez imediatamente antes do commit e justifique por que cada uma das outras mudanças pendentes ficou fora desse commit.
3. **Proteja (O4).** Nenhum novo commit pode **adicionar** uma linha contendo um marcador `SYNTHETIC-NOT-A-CREDENTIAL-`. Decida o que fazer com `deploy-summary.txt` e com o rascunho não relacionado, e justifique a decisão com base no conteúdo deles. Seja qual for a sua escolha, os dois arquivos devem continuar existindo, sem alterações, no diretório de trabalho no momento da avaliação.
4. **Teste a afirmação (O4).** Reúna evidências que mostrem se a regra de ignorar protege `cache-settings.conf`. Depois, garanta que os commits futuros não incluirão esse arquivo, sem apagar sua cópia local nem a linha local pendente dele, e registre isso em um commit separado. Por fim, demonstre se a chave falsa antiga ainda pode ser lida no repositório e diga o que teria que acontecer se fosse uma credencial real. Um commit que para de rastrear um arquivo mostra as linhas antigas dele como removidas; isso é esperado e não é uma nova exposição.
5. **Recupere (O3).** Execute as duas situações, escolhendo a operação para cada uma e explicando o que ela pode e o que não pode recuperar:
   - Acrescente a linha `step-3=untested-idea` a `rollback-plan.txt` e, antes de registrá-la, decida que foi um erro. Descarte essa edição para que o arquivo volte a corresponder ao conteúdo registrado. Nenhum outro arquivo pendente ou local pode ser afetado.
   - Depois que a correção do item 2 estiver registrada, uma pessoa revisora informa que o caminho do health-check estava errado e que a correção precisa ser retirada **sem remover nada do histórico**. Retire-a. Verifique primeiro que nenhum arquivo rastreado tem mudanças pendentes e planeje a ordem do seu trabalho de acordo com isso. Depois, verifique a retirada com evidências que não dependam de onde a correção está no histórico: leia `release-notes.txt` e confirme que ele tem exatamente as três linhas importadas; use `git log --oneline -- ./release-notes.txt` para confirmar que a importação, a correção e um commit mais novo que retira a correção estão todos presentes; e inspecione o próprio commit de retirada com `git show <revert-commit-id>` para confirmar que ele remove somente a linha da correção, somente nesse arquivo. Identifique esse commit pela saída do log em vez de presumir que é o mais recente: é a linha cuja mensagem começa com `Revert` e cita a mensagem da sua correção, e o ID dele é o valor hexadecimal curto no início dessa linha. Substitua `<revert-commit-id>`, inclusive os sinais de menor e maior, por esse valor. O laboratório guiado comparou `HEAD~2` com `HEAD`. Isso era válido lá porque o commit revertido era o mais novo; aqui outro commit pode estar entre a correção e a sua retirada, e a mesma comparação também informaria as mudanças desse commit. Se quiser fazer uma comparação, limite-a a esse único arquivo e nomeie o commit registrado imediatamente antes da correção, usando o ID dele em `git log --oneline`: `git diff --exit-code <id-before-fix> HEAD -- ./release-notes.txt`.
6. **Verifique os limites (O5).** Mostre qual diretório é o nível superior deste repositório, que ele não tem remoto e de onde vem cada valor de configuração ativo.

**Entregáveis:** sua descrição do item 1; a revisão da área de preparação e a mensagem de cada commit que você criou; os motivos de cada inclusão e exclusão; as evidências a favor e contra a afirmação do colega; a demonstração de que a chave antiga continua legível, com a sua declaração da resposta no mundo real; as observações de antes e depois das duas recuperações; as observações dos limites; e o resultado da limpeza. Guarde suas anotações fora do diretório do laboratório, como no laboratório guiado, ou explique-as oralmente; tudo o que estiver guardado dentro do laboratório é apagado durante a limpeza. As anotações precisam de observações e motivos, não de cópias dos valores falsos. As evidências ficam locais.

**Aceitação:** todas as condições a seguir são verdadeiras quando você terminar.

- `git ls-files` lista exatamente `.gitignore`, `release-notes.txt` e `rollback-plan.txt`.
- `release-notes.txt` tem suas três linhas importadas; `rollback-plan.txt` tem suas duas linhas importadas.
- `cache-settings.conf` (três linhas, inclusive a anotação local do seu colega), `deploy-summary.txt` e `onboarding-draft.txt` ainda existem no diretório de trabalho com o conteúdo fornecido.
- O histórico mantém os dois commits fornecidos e acrescenta pelo menos: a correção, o commit que para de rastrear o arquivo de configurações e a retirada da correção. Todo commit que você criou tem uma mensagem que descreve sua mudança.
- Nenhum commit que você criou adiciona uma linha com marcador, e nada foi preparado com uma forma que selecione tudo de uma vez.
- O repositório não tem remoto e usa apenas configuração local.

Um resultado que funciona não compensa um marcador registrado, uma justificativa ausente, um arquivo não relacionado afetado ou uma afirmação que você não sustentou com evidências. Qualquer um desses casos significa **ainda não aprovado**: resolva e repita as verificações afetadas.

**Dicas opcionais:** escreva o estado que você quer antes de executar qualquer coisa. O nome de um arquivo descreve a intenção de alguém, não o conteúdo. Pergunte, para cada recuperação: o erro está na árvore de trabalho, na área de preparação ou já foi registrado? `git revert` aceita qualquer ID de commit mostrado por `git log --oneline`, não apenas `HEAD`. Se um comando afetaria mais de um caminho, procure um mais restrito.

Continue para as [perguntas](#perguntas) e os [critérios de conclusão](#critérios-de-conclusão) antes de remover qualquer coisa.

### Limpeza do desafio

O repositório do desafio fica dentro do mesmo diretório do laboratório e é removido junto com ele. Depois que suas evidências tiverem sido revisadas, siga a [limpeza após a avaliação](#limpeza-após-a-avaliação); a etapa de verificação dela confere `challenge-repo` junto com `guided-repo`. Não remova nenhum dos repositórios separadamente e não apague um diretório `.git` isoladamente.

## Avaliação de conhecimentos

### Perguntas

Responda às dez antes de abrir as [orientações de resposta](#orientações-de-resposta). Explique o mecanismo e a próxima ação segura, não apenas o nome de um comando.

1. **Q1 — O1:** Você edita um arquivo rastreado, prepara-o, edita-o de novo e faz o commit sem preparar outra vez. Qual versão o commit contém e onde está a outra versão?
2. **Q2 — O1/O2:** Por que esta lição prepara caminhos explícitos e revisa `git diff --staged` antes de cada commit? Por que um `git diff` vazio não é evidência de que o próximo commit está vazio?
3. **Q3 — O2:** Cite a inspeção que responde a cada pergunta: o que o próximo commit registraria; o que o commit mais recente alterou; quais arquivos são rastreados; quais commits tocaram um caminho.
4. **Q4 — O3:** Para cada situação, escolha a operação e diga o que se perde: um arquivo preparado por engano; uma edição não registrada indesejada em um arquivo rastreado; um commit registrado que precisa ser retirado.
5. **Q5 — O3:** Depois de uma reversão, por que há mais commits do que antes, e não menos? Por que uma reversão não é uma resposta a um segredo registrado?
6. **Q6 — O4:** Um colega diz: “Adicionei o arquivo de configurações ao `.gitignore`, então o token dentro dele está seguro.” O arquivo foi registrado no mês passado. Que observações você reuniria e o que elas mostram?
7. **Q7 — O4:** Depois de parar de rastrear esse arquivo e fazer o commit, onde o conteúdo antigo ainda pode ser encontrado? O que deve acontecer se o token for real e quem decide?
8. **Q8 — O4:** Um arquivo pendente se chama `deploy-summary.txt`. Por que o nome não é evidência de que é seguro registrá-lo? O que uma revisão da área de preparação detecta e quais são dois de seus limites?
9. **Q9 — O5:** Como você sabe qual repositório um comando Git afetará? Por que o diretório do laboratório não deve ser criado dentro de um repositório existente?
10. **Q10 — O5:** Por que a limpeza deste laboratório usa uma remoção recursiva quando os outros módulos de Fundamentos a proíbem? Cite quatro condições verificadas antes de ela ser executada e diga o que fazer se uma não puder ser confirmada. Como você sabe que o laboratório não alterou a sua própria configuração do Git?

### Orientações de resposta

Compare suas explicações depois de responder. Um raciocínio correto equivalente é aceitável; o nome de um comando sem o seu efeito não é.

- **Q1:** O commit contém a versão preparada. Preparar copia o conteúdo naquele momento. A edição posterior permanece na árvore de trabalho como uma mudança não preparada, visível com `git diff`.
- **Q2:** Caminhos explícitos fazem de cada inclusão uma decisão; o diff preparado é o último ponto em que um conteúdo indesejado pode ser barrado antes de se tornar durável. `git diff` compara a árvore de trabalho com a área de preparação, então ele está vazio exatamente quando tudo o que mudou já foi preparado.
- **Q3:** `git diff --staged`; `git show HEAD` (ou `git show --stat HEAD`); `git ls-files`; `git log --oneline -- <path>`.
- **Q4:** `git restore --staged <path>` altera apenas a área de preparação e não perde nada. `git restore <path>` sobrescreve a cópia de trabalho e a edição descartada é irrecuperável; por isso, inspecione o diff dela e indique um único caminho. `git revert <commit>` adiciona um commit oposto e não perde nada; o original permanece.
- **Q5:** Uma reversão registra um novo commit em vez de apagar um, o que mantém o histórico fiel e é seguro para quem já tem o original. O commit que contém o segredo continua presente e legível, então o segredo continua exposto.
- **Q6:** `git ls-files` mostra que o arquivo é rastreado; `git status` ainda informa suas modificações; `git check-ignore -v` não imprime nada para ele. As regras de ignorar se aplicam apenas a arquivos não rastreados, então a regra nunca se aplicou. A afirmação confunde uma regra de ignorar com proteção do conteúdo registrado.
- **Q7:** Em todo commit anterior que o incluiu, legível com `git show <commit>:<path>` ou `git log -p -- <path>`, neste repositório e em todas as cópias. Um token real deve ser tratado como exposto: avise a pessoa responsável por ele e faça com que seja revogado ou substituído pelo processo dela. Reescrever o histórico é uma decisão separada e especializada, que não recolhe cópias existentes e não é tomada aqui.
- **Q8:** Um nome registra uma intenção, não o conteúdo; o token falso aqui estava sob um campo chamado `debug_context`. Ler o diff preparado detecta, antes do commit, o conteúdo que você reconhece. Ele não detecta o que você não reconhece ou não lê, e não consegue desfazer a exibição na tela ou em gravações.
- **Q9:** `git rev-parse --show-toplevel` imprime o repositório que os comandos no diretório atual afetam, porque o Git procura `.git` no diretório atual e depois nos diretórios pai. Dentro de um repositório existente, os comandos do laboratório poderiam agir sobre esse projeto e os novos repositórios ficariam aninhados.
- **Q10:** O armazenamento interno do Git consiste em muitos arquivos somente leitura com nomes que a pessoa aprendiz não escolheu, então a remoção por nome individual é impraticável. As condições incluem: caminhos registrados definidos e consistentes; não ser o diretório pessoal; ser um diretório de verdade, e não um link simbólico; arquivo marcador presente; localização física igual ao registro; diretório pai fora de um repositório; nível superior, identidade sintética e ausência de remoto de cada repositório; confirmação digitada. Se qualquer uma for inconclusiva, pare e inspecione manualmente, sem modificar o auxiliar. O shell do laboratório leu um arquivo vazio no lugar da configuração global, toda configuração usada foi `--local` e a listagem de configuração mostrou apenas origens `file:.git/config`.

Refaça as [perguntas](#perguntas) em que faltou uma explicação e depois revise os critérios abaixo.

## Critérios de conclusão

A conclusão é **autoavaliada**, ou uma pessoa colega pode revisar as mesmas evidências. Não é uma certificação, uma auditoria de segurança nem uma competência profissional verificada de forma independente. Ler a página ou reproduzir comandos sem explicar os resultados não conta.

| Objetivo | Prática | Avaliação | Evidência necessária | Critério de aprovação |
| --- | --- | --- | --- | --- |
| O1 — Registrar | Passos 3–5 do guia | Item 2 do desafio; Q1, Q2 | Nível superior do repositório verificado, a lista de commits com mensagens e uma explicação dos três lugares | Cada commit que você criou registra uma mudança selecionada, foi preparado por caminho explícito e tem uma mensagem descritiva; a pessoa aprendiz afirma corretamente onde uma mudança está em cada etapa |
| O2 — Inspecionar | Passos 4–5 e 12 do guia | Item 1 do desafio; Q2, Q3 | Diffs não preparados e preparados antes de registrar, log e inspeção de commit depois, e a descrição do desafio baseada em evidências | As previsões concordam com os diffs observados; toda afirmação da descrição é sustentada pela saída de um comando nomeado |
| O3 — Recuperar | Passos 6, 10 e 11 do guia | Item 5 do desafio; Q4, Q5 | Observações de antes e depois de uma remoção da preparação, de uma edição descartada e de uma reversão, com a declaração do que cada uma não consegue recuperar | Somente o caminho pretendido é afetado a cada vez; o conteúdo revertido é igual ao conteúdo registrado anteriormente; o commit original continua no log; os limites são declarados corretamente |
| O4 — Proteger | Passos 6–9 do guia | Itens 3 e 4 do desafio; Q6, Q7, Q8 | Revisão da preparação que detectou o token falso; preparação recusada de um arquivo ignorado; evidência de arquivo rastreado contra a afirmação sobre a regra de ignorar; conteúdo antigo lido do histórico depois que o rastreamento parou; a resposta a uma exposição real | Nenhum commit criado pela pessoa aprendiz adiciona uma linha com marcador, exceto o commit do guia rotulado como erro intencional; a pessoa aprendiz separa ignorar, parar de rastrear e histórico, e cita a revogação pela pessoa responsável como a resposta |
| O5 — Limpar | Passos 1–3 e 12 do guia; limpeza | Item 6 do desafio; revisão da limpeza; Q9, Q10 | Versão do Git anotada, observações de nível superior e de ausência de remoto para os dois repositórios, origens da configuração, ação de verificação aprovada, confirmação digitada e observação final de ausência | Os dois repositórios estão dentro do laboratório e são independentes; não existe remoto; somente a configuração local está em vigor; o diretório do laboratório está ausente depois de uma remoção verificada e confirmada; nada fora dele foi tocado |

**Aprovação:** cada linha e cada resposta da avaliação satisfazem seu critério. Segurança e limpeza são obrigatórias; nenhuma pontuação compensatória se aplica. **Ainda não aprovado:** qualquer linha sem evidência, um marcador adicionado por um commit fora do erro guiado rotulado, uma forma de preparação que seleciona tudo de uma vez, um arquivo não relacionado alterado ou removido, ou uma limpeza executada sem uma verificação aprovada.

**Tentativa limitada pelo ambiente:** se a verificação de versão interromper o laboratório, ou se um ponto de verificação não puder ser reproduzido no seu ambiente, registre a observação real e a sua versão do Git, rotule o critério afetado como **não verificado** e faça a limpeza com segurança. Uma explicação correta é evidência conceitual, mas não substitui o requisito prático. Não invente um resultado aprovado e não instale, atualize nem reconfigure software apenas para obtê-lo.

Revise O1–O4 e as observações dos limites do O5 enquanto os dois repositórios existem. Depois, faça a [limpeza](#limpeza-após-a-avaliação) e use o resultado dela para concluir o O5. Para remediar, use o [procedimento de retomada](#retomar-uma-sessão-interrompida) para um estado conhecido, ou faça a limpeza e comece um laboratório novo. Relate separadamente a revisão da documentação, as verificações de sintaxe e a execução real.

## Próximos passos

Se localizações, aspas ou status de saída ainda estavam incertos, revisite [Operações Seguras com Arquivos no Terminal](terminal-file-operations.md). Para um tratamento mais completo de quem pode ler um arquivo e do que pertence a uma evidência compartilhável, continue com [Acesso Local e Segredos de Teste](local-access-and-secrets.md); ele exige o mesmo pré-requisito deste módulo e nenhum dos dois módulos exige o outro. A [trilha de aprendizagem de Fundamentos](../../../learning-paths/foundations.md) (em inglês) mostra os três módulos atuais e uma ordem sugerida.

Trabalhar com outras pessoas traz tópicos que este módulo deixou de fora deliberadamente: repositórios remotos e autenticação, clonagem e troca de commits, branches e merges, resolução de conflitos e fluxos de revisão. Módulos sobre esses assuntos estão **planejados e ainda não disponíveis**; ainda não existem links. Reescrever o histórico, hooks e assinatura de commits são assuntos posteriores e mais especializados.

Para melhorar este módulo, use o [guia de autoria do currículo](../../../curriculum-authoring-guide.md) (em inglês).
