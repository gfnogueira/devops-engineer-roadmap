# Operações Seguras com Arquivos no Terminal

## Visão geral

**Competência:** `terminal-file-operations` · **Nível:** Fundamentos · **Revisão da avaliação:** 2

Você está preparando uma pequena pasta de entrega (handoff, a passagem de informações de uma pessoa ou equipe para outra) para um serviço fictício. É preciso preservar as anotações originais, organizar uma cópia de trabalho, se recuperar quando um arquivo parece ter sumido e remover seu trabalho temporário sem tocar em mais nada.

Siga **Aprender → Praticar → Construir → Validar**: leia os conceitos, conclua o laboratório guiado, resolva um desafio de entrega diferente e, por fim, inspecione as evidências em relação a cada critério de conclusão. O objetivo é explicar e verificar suas ações, não decorar comandos.

**Situação da verificação:** a documentação e as fontes indicadas foram revisadas em 2026-11-12. O laboratório e o desafio foram executados depois, bloco a bloco, **somente em Linux**, em contêineres descartáveis (Ubuntu 24.04, `dash`, utilitários GNU, uma única arquitetura de processador). Dos 25 casos planejados, 24 passaram e 1 não se aplica (exige a injeção deliberada de uma falha); nenhum falhou. O [relatório de encerramento em Linux](../../../validation/terminal-file-operations-linux-l1-closure.md) (em inglês) registra as evidências e seus limites, e, além desta nota de situação, o texto deste módulo em inglês não mudou desde essa execução. **Ainda não validados:** macOS, outros ambientes Linux e outros shells, as perguntas de conhecimento e as tabelas de autoavaliação, e a solução própria do desafio feita por quem aprende. As saídas abaixo são resultados esperados, não transcrições registradas; se o seu sistema for diferente, investigue antes de supor um erro.

*Nota sobre os blocos de código: comandos, comentários e saídas de exemplo permanecem em inglês, exatamente como no módulo canônico, para que você possa compará-los com manuais e com o que o seu terminal mostra. O texto em português ao redor explica o que cada bloco faz. Neste módulo, “sintético” significa fictício: criado apenas para o exercício e sem valor real.*

## Por que isso importa

O trabalho operacional costuma começar com arquivos comuns: logs, rascunhos de configuração, anotações de implantação e evidências de incidentes. Um comando executado no diretório errado pode inspecionar o artefato errado ou sobrescrever evidências úteis. Um comando de cópia bem-sucedido, por si só, não prova que você copiou o arquivo pretendido.

Use um hábito repetível: estabeleça sua localização, identifique a origem e o destino, preveja a mudança, execute e inspecione o resultado. Esse hábito se aplica mais tarde ao trabalho com Git e com controle de acesso. Um backup local ajuda a se recuperar de um erro no laboratório; não é uma estratégia de backup para produção.

## Pré-requisitos

Não há competências pré-requisito. Você deve ser capaz de abrir um aplicativo de terminal e digitar ou colar um comando por vez. O terminal é a janela que recebe o que você digita e mostra as saídas; o shell é o programa que interpreta os comandos.

Ambiente necessário:

- Um computador local com Linux ou macOS, com `/bin/sh` e os utilitários padrão: `env`, `pwd`, `ls`, `mkdir`, `cat`, `printf`, `cp`, `mv`, `cmp`, `rm`, `rmdir` e `test`. `cd`, `umask` e `set` podem ser comandos internos (built-ins) do shell.
- Uma conta de usuário comum e um diretório local, pessoal e gravável, no qual criar o laboratório. O [passo a passo do diretório inicial](#encontre-um-diretório-inicial) mostra como encontrar um sem usar atalhos do gerenciador de arquivos. Evite diretórios compartilhados, sincronizados, de produção ou de repositórios.
- Um sistema de arquivos com suporte a permissões Unix comuns. Se políticas da organização ou listas de controle de acesso (ACLs) herdadas afetarem as permissões, pare no ponto de verificação de segurança e busque orientação específica para o seu ambiente; não altere a política do sistema.

Não é necessário ter conta de nuvem, serviço pago, Docker, instalação de pacotes nem privilégios elevados. Os comandos usam sintaxe e opções compatíveis com POSIX, sem opções exclusivas do GNU. Prompts, mensagens de diagnóstico, formato das listagens e sufixos de permissão exatos podem variar entre sistemas. Essas escolhas de portabilidade ainda precisam de testes de execução nas duas plataformas.

Execute os blocos em ordem e inspecione cada resultado. Não cole a lição inteira como se fosse um script: alguns comandos falham de propósito e os pedidos de confirmação de exclusão precisam da sua resposta. Pare diante de qualquer falha **inesperada**. Todas as escritas do exercício ficam dentro do diretório de laboratório recém-criado; não use arquivos pessoais existentes, credenciais, links simbólicos nem árvores de diretórios importadas.

## Objetivos de aprendizagem

Ao final, você será capaz de:

- **O1 — Localizar:** a partir da raiz do laboratório e de um diretório filho, identificar o diretório atual e resolver um caminho relativo até o mesmo arquivo, explicando como ele difere de um caminho absoluto.
- **O2 — Preservar:** criar texto sintético, copiá-lo, renomear uma cópia de trabalho, acrescentar uma anotação e demonstrar que o original e seu backup continuam idênticos byte a byte.
- **O3 — Diagnosticar:** explicar um erro intencional de arquivo ausente usando o diretório atual, o caminho e o status de saída, e então recuperar o acesso ao arquivo existente sem recriá-lo.
- **O4 — Proteger:** tratar um nome de arquivo com espaços como um único argumento, verificar permissões restritivas na criação e demonstrar que uma tentativa de sobrescrita por redirecionamento deixa o original intacto.
- **O5 — Limpar:** identificar e remover apenas arquivos do próprio laboratório, remover diretórios vazios e verificar a remoção do laboratório, explicando os limites da recuperação após uma exclusão.

## Conceitos fundamentais

### A localização dá sentido ao caminho

Um diretório contém entradas com nome. Um caminho absoluto começa em `/`; um caminho relativo começa no seu diretório de trabalho atual. `.` significa esse diretório e `..`, o diretório pai. `pwd -P` mostra o caminho físico do diretório de trabalho; `cd` muda o diretório de trabalho do seu shell. Nenhum dos dois move seus arquivos. Veja as definições POSIX de [pwd](https://man7.org/linux/man-pages/man1/pwd.1p.html) e [cd](https://man7.org/linux/man-pages/man1/cd.1p.html).

A partir da raiz do laboratório, `./inbox/service notes.txt` seleciona as anotações. A partir de `./work`, o mesmo arquivo é `../inbox/service notes.txt`. Preveja os dois resultados antes de tentar. Um erro de caminho inexistente pode significar que o diretório de partida está errado, não que o arquivo foi apagado.

`ls` lista as entradas; `ls -a` inclui nomes que começam com ponto. `ls -l` acrescenta detalhes, e `ls -ld .` descreve o próprio diretório atual. Um nome oculto é apenas uma convenção de exibição, não uma barreira de segurança. Inspecionamos as listagens como pessoas, em vez de escrever código que dependa do formato delas. Veja [ls](https://man7.org/linux/man-pages/man1/ls.1p.html).

### O shell interpreta sua entrada antes de um utilitário rodar

Em `cat './inbox/service notes.txt'`, `cat` é o comando e o caminho entre aspas é um único argumento. Sem aspas, os espaços podem dividir os argumentos. Aspas simples preservam o texto literal; aspas duplas permitem a expansão de variáveis e mantêm junto um caminho expandido. Use aspas ASCII retas, não aspas tipográficas.

Mais adiante, `lab_root=$(pwd -P)` guarda a saída de `pwd -P` em uma variável. `"$lab_root"` expande esse valor com segurança como um único argumento. O nome é específico deste exercício; não substitua variáveis do sistema. Prefixar nomes de arquivo relativos com `./` também evita que um hífen no início seja confundido com uma opção de comando. Evite exclusão com curingas: o curinga seleciona os nomes antes que o comando de remoção os veja.

`printf '%s\n' 'service=demo'` imprime um texto seguido de uma quebra de linha. O `>` do shell redireciona a saída para um arquivo, normalmente substituindo seu conteúdo; `>>` acrescenta ao final. `cat` exibe os pequenos arquivos de texto que criamos. Uma opção de cópia não consegue proteger um arquivo contra um redirecionamento do shell. Veja [printf](https://man7.org/linux/man-pages/man1/printf.1p.html), [cat](https://man7.org/linux/man-pages/man1/cat.1p.html) e a referência do shell abaixo.

Ativamos [`set -C`](https://man7.org/linux/man-pages/man1/set.1p.html) (noclobber) para recusar sobrescritas comuns com `>` de arquivos regulares existentes. É uma trava de segurança, não um backup: ela não impede acréscimos, cópias, movimentações nem exclusões. Não a contorne para fazer um exemplo que falha passar.

### Copiar, mover e verificar são operações diferentes

`cp` cria uma cópia separada do conteúdo de um arquivo; `mv` muda a localização ou o nome de um arquivo. Os dois podem substituir um destino. Usamos `-i` para pedir confirmação antes da substituição, mas um destino novo não gera pergunta. Se o destino for um diretório existente, a origem pode ser colocada dentro dele em vez de receber um novo nome de arquivo. Inspecione os destinos primeiro. Veja [cp](https://man7.org/linux/man-pages/man1/cp.1p.html) e [mv](https://man7.org/linux/man-pages/man1/mv.1p.html).

`cmp` compara bytes. Nenhuma saída e status de saída `0` significam que os arquivos são iguais; status `1` significa que são diferentes; um valor maior indica um erro na comparação. `$?` é o status de saída do comando anterior, então inspecione-o imediatamente. Em geral, `0` indica sucesso e um status diferente de zero precisa ser interpretado. `&&` executa o próximo comando somente quando o anterior tem sucesso; `||` o executa somente quando o anterior falha. Nenhum dos dois significa “continue sempre”. Veja [cmp](https://man7.org/linux/man-pages/man1/cmp.1p.html).

### Limite o estrago antes de trabalhar

Iniciamos um shell separado, definimos `umask 077` e criamos um diretório novo. Em uma configuração comum de permissões Unix, isso resulta em diretórios somente do proprietário (`drwx------`) e em arquivos de texto novos também restritos (`-rw-------`). A máscara afeta apenas criações novas, não arquivos existentes; ela não é criptografia nem uma auditoria completa das listas de controle de acesso. Veja [umask](https://man7.org/linux/man-pages/man1/umask.1p.html).

Em uma listagem longa, o primeiro caractere identifica o tipo da entrada (`d` para diretório, `-` para arquivo regular). Os três grupos seguintes descrevem as permissões do proprietário, do grupo e dos outros. `r` significa leitura, `w` escrita e `x` execução (para arquivos) ou travessia (para diretórios); `-` significa que a permissão correspondente não existe. Os seis traços finais acima são a verificação básica de grupo/outros.

`rm -i` pergunta antes de remover um arquivo indicado pelo nome; ele não o envia para a Lixeira da área de trabalho. `rmdir` remove diretórios vazios e recusa os que não estão vazios. Essa recusa é uma evidência útil de que ainda resta algo. Nenhum dos dois oferece desfazer. Veja [rm](https://man7.org/linux/man-pages/man1/rm.1p.html) e [rmdir](https://man7.org/linux/man-pages/man1/rmdir.1p.html). Nossa limpeza usa nomes exatos, sem exclusão recursiva, sem opção de forçar e sem curingas.

## Recursos recomendados

Use-os de forma seletiva enquanto trabalha, não como uma maratona de leitura obrigatória antes de começar. Todas as páginas indicadas abaixo e as referências dos utilitários acima foram abertas e revisadas em **2026-11-12**. Elas podem ser lidas gratuitamente e sem conta; os exercícios locais não exigem infraestrutura paga. Os recursos estão em inglês.

| Recurso e publicador | Leia para | Escopo e limitações |
| --- | --- | --- |
| [Shell Script Basics — Apple](https://developer.apple.com/library/archive/documentation/OpenSource/Conceptual/ShellScripting/shell_scripts/shell_scripts.html) | A relação entre comandos, execução do shell e status; O1–O3 | Introdução oficial arquivada, atualizada em 2014; leitura introdutória selecionada, não uma garantia para a versão atual do macOS |
| [Designing Scripts for Cross-Platform Deployment — Apple](https://developer.apple.com/library/archive/documentation/OpenSource/Conceptual/ShellScripting/PortingScriptstoMacOSX/PortingScriptstoMacOSX.html) | Por que ferramentas Unix parecidas podem se comportar de forma diferente e por que os exemplos evitam extensões do shell; O2/O4/O5 | Orientação arquivada; foque na portabilidade, não nos exemplos históricos de administração de sistemas |
| [POSIX sh](https://man7.org/linux/man-pages/man1/sh.1p.html), [cp](https://man7.org/linux/man-pages/man1/cp.1p.html), [mv](https://man7.org/linux/man-pages/man1/mv.1p.html) e [cmp](https://man7.org/linux/man-pages/man1/cmp.1p.html) — texto do IEEE/The Open Group reproduzido em man7.org | Consulte a execução do shell, o comportamento do destino, a substituição interativa e o status da comparação conforme precisar; O1–O4 | POSIX.1-2017 / Issue 7, edição de 2018; definições do padrão, não prova de uma implementação instalada específica |
| [POSIX umask](https://man7.org/linux/man-pages/man1/umask.1p.html), [rm](https://man7.org/linux/man-pages/man1/rm.1p.html) e [rmdir](https://man7.org/linux/man-pages/man1/rmdir.1p.html) — mesmos publicadores e mesma reprodução | Permissões na criação, pedidos de confirmação de remoção e limpeza de diretórios vazios; O4/O5 | Mesma edição do padrão; consulte os manuais locais para detalhes da plataforma |

O site do The Open Group retornou HTTP 403 durante esta revisão; o texto do padrão que foi inspecionado era a reprodução atribuída em man7.org. A revisão das fontes estabelece a intenção documentada, não que este laboratório foi executado com sucesso. Páginas de manual locais, como `man cp`, ajudam a conferir as ferramentas instaladas no seu sistema; pressione `q` para sair do paginador.

## Laboratórios práticos

### Praticar: preparar e recuperar uma entrega de serviço

**Objetivo:** produzir um original inalterado, um backup idêntico e uma cópia de trabalho revisada; explicar uma falha de caminho ausente e verificar duas proteções de segurança. Objetivos de aprendizagem: O1–O5.

#### Encontre um diretório inicial

Abra o aplicativo de terminal. Digite `pwd -P` e pressione Enter para ver sua localização atual; não digite o símbolo do prompt, como `$`. Depois, digite `cd` sem argumento para ir ao diretório pessoal (home) da sua conta. Isso muda a localização do seu shell, não o conteúdo de nenhum arquivo. Execute cada linha separadamente e pare se algum comando relatar erro:

```sh
pwd -P
cd
pwd -P
ls -ld .
```

O segundo caminho identifica seu diretório pessoal, geralmente em `/home` no Linux ou em `/Users` no macOS; use a saída real, não esses exemplos como um caminho para copiar. `ls -ld .` descreve esse diretório. Em um computador pessoal com um diretório pessoal local e não sincronizado, use-o como pai do novo laboratório. O exercício criará apenas o próprio diretório filho ali.

Se o seu diretório pessoal for compartilhado, sincronizado, gerenciado ou um repositório, peça a um instrutor ou administrador que indique um diretório local gravável já existente. Para entrar nele, digite `cd`, um espaço e o caminho absoluto real entre aspas simples; depois execute `pwd -P` e confirme a localização. Não adivinhe um caminho nem altere suas permissões. Se não conseguir identificar um local adequado, pare antes da configuração.

Você acaba de praticar como identificar e mudar de localização antes de criar qualquer coisa. Os blocos que controlam configurações do shell e o tratamento de erros, mais adiante, são auxiliares de segurança: entenda quando parar, mas você não precisa memorizar a sintaxe de controle deles para demonstrar as operações com arquivos.

#### 1. Estabeleça um espaço de trabalho isolado

A partir do diretório pai pessoal escolhido nos Pré-requisitos, inicie o shell do laboratório. Os valores de ambiente vazios abaixo suprimem um arquivo de inicialização `ENV` e o histórico persistente do shell neste shell filho; eles não editam seus arquivos de configuração. [`env`](https://man7.org/linux/man-pages/man1/env.1p.html) fornece esses valores somente ao shell que ele invoca. Não os altere para caminhos em outros lugares.

```sh
env ENV= HISTFILE= /bin/sh
```

Execute o bloco a seguir **nesse novo shell**. Um shell filho é um interpretador de comandos separado; suas configurações e variáveis não alteram as do shell que o iniciou. `if ... then ... else ... fi` escolhe um ramo de sucesso ou de falha. `unset` apaga um valor antigo para que uma configuração que falhe não reutilize o caminho de um laboratório anterior. Sem `-p`, `mkdir` recusa um nome que já existe. A cadeia `&&` só registra uma localização depois de criar e entrar no novo diretório com sucesso.

```sh
umask 077
set -C
unset lab_root
if mkdir ./terminal-file-operations-lab &&
   cd ./terminal-file-operations-lab &&
   lab_root=$(pwd -P); then
  printf 'Lab root: %s\n' "$lab_root"
  ls -ld .
else
  printf '%s\n' 'STOP: setup failed. Inspect the error before continuing.'
fi
```

**Ponto de verificação:** o caminho impresso termina em `/terminal-file-operations-lab` e o modo do diretório começa com `drwx------`. Anote o caminho de forma privada para poder encontrar este espaço de trabalho novamente. Se houver falha, o shell continua aberto, mas não avance para o passo 2. Se o nome já existir, não o apague para abrir espaço: escolha outro diretório pai pessoal ou use [retomar uma sessão interrompida](#retomar-uma-sessão-interrompida) se for o laboratório que você registrou. Pare se a expectativa de permissão não se confirmar. Não use `sudo` nem altere permissões fora do laboratório.

#### 2. Crie e inspecione a entrada sintética

```sh
mkdir ./inbox ./work ./backup
printf '%s\n' 'service=demo' 'status=ready' > './inbox/service notes.txt'
printf '%s\n' 'synthetic workspace marker; not a secret' > ./.lab-marker
ls -a .
ls -l './inbox/service notes.txt'
cat './inbox/service notes.txt'
```

**Ponto de verificação:** a listagem inclui `inbox`, `work`, `backup` e `.lab-marker`. As anotações têm exatamente duas linhas, `service=demo` e `status=ready`. O modo delas começa com `-rw-------`. Um sufixo como `+` ou `@` pode indicar metadados adicionais da plataforma; os bits de modo básicos, sozinhos, não estabelecem o acesso efetivo. Este exercício verifica as permissões básicas de criação, não todas as permissões do seu computador.

O marcador mostra que arquivos com nome iniciado por ponto (dotfiles) continuam existindo mesmo quando uma listagem comum os omite. Todos os valores são sintéticos. Nunca os substitua por configuração real de serviço ou tokens.

#### 3. Preserve o original e organize uma cópia de trabalho

```sh
cp -i './inbox/service notes.txt' './backup/service notes.txt'
cp -i './inbox/service notes.txt' ./work/draft.txt
mv -i ./work/draft.txt './work/handoff notes.txt'
printf '%s\n' 'review=complete' >> './work/handoff notes.txt'
cmp './inbox/service notes.txt' './backup/service notes.txt'
printf 'Comparison status: %s\n' "$?"
cat './work/handoff notes.txt'
ls -a ./work
```

**Ponto de verificação:** a comparação é silenciosa, com status `0`; o arquivo de entrega (handoff) tem três linhas, com `review=complete` por último; `draft.txt` não existe mais. Explique por que modificar a cópia não modificou o original. Em uma execução limpa, não deve haver pedidos de substituição. Se um pedido aparecer inesperadamente, responda `n` e inspecione antes de continuar; repetir um bloco pode acrescentar linhas duplicadas.

O conteúdo especificado de duas linhas do original o torna a referência para a preservação. O arquivo de entrega de três linhas serve a outro propósito. Ao escolher uma entrada ou uma cópia de recuperação, inspecione o conteúdo em relação ao estado exigido, em vez de confiar em um nome tranquilizador como `backup` ou `ready`.

#### 4. Diagnostique a falha segura

Um colega diz que as anotações desapareceram depois de entrar no diretório de trabalho. Primeiro, preveja o resultado a seguir. Execute `cd` separadamente e confirme que teve sucesso antes das demais linhas:

```sh
cd ./work
pwd -P
cat './inbox/service notes.txt'
printf 'Read status: %s\n' "$?"
```

**Falha intencional esperada:** `cat` relata um arquivo ausente e o status impresso é diferente de zero. A partir de `work`, o local solicitado é `work/inbox/service notes.txt`, que nunca foi criado. A mensagem de erro depende da plataforma. Nenhum arquivo é modificado por essa leitura que falhou.

Antes de usar a recuperação abaixo, declare sua hipótese e uma verificação somente de leitura. Não crie outro `inbox` para esconder o erro.

```sh
ls -a ..
cat '../inbox/service notes.txt'
if test -n "$lab_root" &&
   cat "$lab_root/inbox/service notes.txt" &&
   cd "$lab_root" &&
   test "$(pwd -P)" = "$lab_root"; then
  pwd -P
else
  printf '%s\n' 'STOP: Could not verify the lab files and working directory. Check lab_root, the expected files, and your current location before continuing.'
fi
```

**Ponto de verificação:** as duas leituras mostram as mesmas duas linhas originais; você volta à raiz do laboratório registrada e nenhuma linha `STOP` aparece. O bloco só muda de diretório depois que `test -n` mostra que `lab_root` não está vazia, porque `cd ""` pode relatar sucesso sem se mover, e compara sua localização física com o caminho registrado antes de usar novamente os nomes de arquivo relativos do laboratório. Explique por que o caminho relativo mudou, mas o caminho absoluto armazenado continuou funcionando. Registre a falha, o status, o diagnóstico e a evidência da recuperação.

#### 5. Verifique a proteção contra sobrescrita e as opções de recuperação

Na raiz do laboratório, tente substituir o original de propósito usando um redirecionamento comum:

```sh
printf '%s\n' 'wrong replacement' > './inbox/service notes.txt'
printf 'Overwrite status: %s\n' "$?"
cmp './inbox/service notes.txt' './backup/service notes.txt'
printf 'Comparison status: %s\n' "$?"
```

**Falha intencional esperada:** o noclobber rejeita o redirecionamento com um status diferente de zero. A comparação continua silenciosa, com status `0`. Se a sobrescrita tiver sucesso, a proteção não estava ativa: marque este ponto de verificação como reprovado, inspecione os arquivos e recupere a partir do backup íntegro. Não declare a verificação de proteção como aprovada apenas porque você reparou o resultado.

Para uma alteração acidental na cópia de trabalho, inspecione o backup com `cat` e restaure somente o arquivo de trabalho com `cp -i './backup/service notes.txt' './work/handoff notes.txt'`. Confirme a substituição somente depois de ler os dois caminhos. Compare a cópia restaurada com o backup, depois acrescente a linha de revisão uma única vez e confira novamente as três linhas. Esta é uma orientação de recuperação, não um comando adicional para executar quando o resultado está correto.

Se um original foi removido acidentalmente, o backup intacto pode fornecer seu conteúdo novamente. Se as duas cópias sumirem, estes comandos não têm como desfazer a remoção: recrie **apenas este exercício sintético** a partir da entrada especificada e repita a avaliação. Não generalize esse método de recuperação para evidências reais. Evite seguir adiante enquanto algum ponto de verificação reprovado não estiver resolvido.

#### 6. Mantenha o espaço de trabalho para o desafio

Mantenha o mesmo shell aberto e o diretório do laboratório no lugar. Continue para o [desafio independente](#desafios-práticos), responda às [perguntas da avaliação](#perguntas) e revise os [critérios de conclusão](#critérios-de-conclusão) antes de voltar para a [limpeza](#limpeza-após-a-avaliação). Não execute os blocos de limpeza enquanto lê adiante. Se for parar agora, você pode fazer a limpeza e começar um laboratório novo depois; isso não conta como ter concluído o desafio.

#### Retomar uma sessão interrompida

Use este caminho depois de perder uma sessão ou quando a configuração nova se recusa a prosseguir porque o laboratório que você registrou já existe. Se o shell do laboratório ainda estiver aberto e `test -n "$lab_root"` tiver sucesso, volte com `cd "$lab_root"`, confirme que `pwd -P` imprime o mesmo caminho antes de usar qualquer nome de arquivo relativo e, então, inspecione o estado usando a tabela abaixo. Se `lab_root` estiver vazia ou os caminhos forem diferentes, não use nomes relativos; use o bloco de restauração abaixo. Retomar não recria arquivos nem repete acréscimos.

Se o shell do laboratório foi fechado, inicie um novo com o comando a seguir. Se você acabou de receber uma mensagem de falha na configuração e esse shell filho ainda estiver aberto, pule este comando e use o bloco de restauração diretamente; não aninhe outro shell.

```sh
env ENV= HISTFILE= /bin/sh
```

No bloco abaixo, **substitua o texto de exemplo entre aspas pelo caminho absoluto exato do laboratório que você registrou**, mantendo as aspas. Não use um caminho adivinhado. O texto de exemplo deliberadamente não identifica um espaço de trabalho real. Se você não guardou o caminho, localize e identifique seu laboratório antes de continuar; não execute a limpeza em outro diretório.

```sh
unset lab_root
if cd '/replace-with-your-recorded-path/terminal-file-operations-lab' &&
   lab_root=$(pwd -P); then
  umask 077
  set -C
  printf 'Resumed lab root: %s\n' "$lab_root"
  ls -ld .
  ls -a .
else
  unset lab_root
  printf '%s\n' 'STOP: the recorded lab could not be opened.'
fi
```

**Ponto de verificação:** compare o caminho físico impresso com o caminho que você registrou, confirme o modo do diretório e inspecione as entradas que você reconhece do laboratório. As entradas esperadas dependem de onde você parou; `.lab-marker` só existe depois do passo 2. Pare diante de um caminho inesperado, de arquivos desconhecidos ou de uma verificação de permissão que falhou. A máscara não repara permissões já existentes.

| Estado que você observa | Próxima ação segura |
| --- | --- |
| Apenas alguns arquivos/diretórios do passo 2 existem | Inspecione cada arquivo existente; crie somente os artefatos que faltam do passo 2. Não execute novamente o bloco inteiro. |
| O original e o backup existem | Leia os dois e compare-os antes de usar qualquer um para recuperação. Continue somente se o original tiver as duas linhas especificadas e o backup for igual a ele. |
| Já existe um rascunho (draft) ou um arquivo de entrega (handoff) | Inspecione-o e continue a partir da operação inacabada do passo 3. Se o arquivo de entrega já tiver a linha de revisão, não a acrescente de novo. Use a orientação de recuperação do passo 5 para uma cópia de trabalho incorreta. |
| O laboratório guiado está concluído | Repita as observações somente de leitura, se necessário, e continue para o desafio. Inspecione qualquer trabalho de desafio existente antes de acrescentar algo. |
| Você não consegue estabelecer um estado inicial confiável | Inspecione e remova apenas os artefatos identificados do laboratório por meio do procedimento de limpeza e, depois, faça uma configuração nova. Não contorne o noclobber nem sobrescreva arquivos desconhecidos para forçar um recomeço. |

Escolha um ponto de verificação para retomar e registre o que já estava presente. Este caminho restaura a sessão; ele não estabelece automaticamente que algum critério de aprendizagem foi atendido.

#### Limpeza após a avaliação

Use esta seção depois do [desafio](#desafios-práticos), das [perguntas](#perguntas) e da [revisão das evidências](#critérios-de-conclusão), ou para interromper com segurança uma tentativa incompleta. Termine de inspecionar as evidências antes de remover. Mantenha evidências pessoais em privado; não envie transcrições do terminal com nomes de usuário ou caminhos absolutos pessoais. Você pode escrever um breve relatório de observações, com dados sensíveis omitidos, dentro do laboratório e revisá-lo antes de apagá-lo.

Primeiro, volte ao espaço de trabalho conhecido e inspecione-o. `test -n` exige um caminho registrado não vazio, porque um shell pode tratar `cd ""` como sucesso sem mudar de diretório. `&&` interrompe a sequência quando qualquer verificação falha, e a comparação confirma que sua localização física é igual ao caminho registrado antes de qualquer listagem. Se o diretório exibido não for o seu laboratório, ou se aparecer uma linha `STOP`, **pare**.

```sh
if test -n "$lab_root" &&
   cd "$lab_root" &&
   test "$(pwd -P)" = "$lab_root"; then
  pwd -P
  ls -a .
else
  printf '%s\n' 'STOP: the recorded lab root is empty or does not match your location.'
fi
```

Remova primeiro os artefatos do desafio, se você os criou, usando a [limpeza do desafio](#limpeza-do-desafio). Remova qualquer relatório extra do laboratório somente depois de inspecionar o nome explícito do arquivo. Depois, execute cada um destes comandos separadamente, respondendo a cada pergunta somente depois de conferir o alvo. `rm -i` remove permanentemente estas entradas indicadas pelo nome quando você confirma; responda `n` se tiver dúvida.

```sh
rm -i './work/handoff notes.txt'
rm -i './backup/service notes.txt'
rm -i './inbox/service notes.txt'
rm -i ./.lab-marker
rmdir ./work ./backup ./inbox
ls -a .
```

**Ponto de verificação:** a raiz do laboratório contém apenas `.` e `..`. Se algum diretório não estiver vazio, inspecione-o com `ls -a` e remova individualmente apenas artefatos conhecidos do laboratório. Não acrescente opções recursivas nem de forçar. Se o laboratório parou no meio, remova somente os arquivos que realmente existem; um `draft.txt` que tenha sobrado, por exemplo, deve ser inspecionado antes de ser removido individualmente.

Por fim, use este auxiliar de segurança para sair do laboratório e remover seu diretório, agora vazio. `test -n` exige um caminho registrado não vazio, e o teste seguinte exige que sua localização física coincida com ele. Somente então o bloco pode mudar de diretório e remover exatamente esse caminho absoluto. A verificação de ausência, a mensagem de sucesso e o `exit` só são alcançados depois de uma remoção bem-sucedida; o restante do conteúdo do diretório pai permanece intocado.

```sh
if test -n "$lab_root" &&
   test "$(pwd -P)" = "$lab_root" &&
   cd .. &&
   rmdir "$lab_root" &&
   test ! -e "$lab_root"; then
  printf '%s\n' 'Lab directory removed.'
  exit
else
  printf '%s\n' 'STOP: cleanup is incomplete. The shell remains open for inspection.'
fi
```

**Ponto de verificação:** a mensagem de sucesso só aparece depois da remoção e da verificação do caminho absoluto registrado; em seguida, o shell filho termina, deixando intactas as configurações do shell pai. `test` informa condições por meio do seu status; `! -e` verifica que um caminho não resolve para nenhuma entrada existente. Aqui ele é uma evidência de apoio depois de um `rmdir` bem-sucedido, não um substituto para esse resultado. Veja [test](https://man7.org/linux/man-pages/man1/test.1p.html).

Em caso de falha, mantenha o shell aberto e inspecione o erro. Execute `pwd -P` para ver se você ainda está dentro do laboratório ou se chegou ao diretório pai. Se `rmdir` relatou que ainda há conteúdo e `lab_root` não está vazia, inspecione `ls -a "$lab_root"` e execute novamente o primeiro bloco desta seção, que exige que `lab_root` não esteja vazia, entra no diretório e compara `pwd -P`, antes de remover qualquer resto identificado pelo seu nome explícito. Se a variável estiver ausente ou o diretório não puder ser localizado, use o caminho registrado e o procedimento de retomada; não adivinhe. Repita o bloco final somente a partir da raiz do laboratório verificada. Depois de uma limpeza bem-sucedida, volte aos [critérios de conclusão](#critérios-de-conclusão) para finalizar o O5.

## Desafios práticos

### Construir: preparar uma entrega diferente sem uma receita de comandos

Um colega fictício precisa de uma entrega para uma implantação pendente, mas deixou anotações atuais e obsoletas. Decida qual entrada pertence à entrega e explique sua escolha, preservando os dois originais. Trabalhe dentro da raiz do laboratório existente, em um novo diretório `./challenge`. Use apenas texto sintético e as técnicas que você praticou; não reutilize a solução das anotações de serviço como seu produto final.

Produza este estado usando sua própria sequência de comandos:

1. Prepare dois arquivos de origem em `./challenge/source`: `release checklist.txt` contém exatamente `package=demo` e `check=pending`; `earlier draft.txt` contém exatamente `package=demo` e `check=obsolete`. Cada valor fica em sua própria linha. Estas são entradas fornecidas; nenhuma delas pode ser editada, renomeada ou removida antes da avaliação.
2. Inspecione o conteúdo e escolha a entrada apropriada para a implantação pendente. Explique qual valor sustenta sua decisão. Mantenha um backup byte a byte dessa entrada, com o nome de arquivo original, em `./challenge/backup`; preserve também a outra origem.
3. Prepare uma cópia de trabalho da entrada escolhida como `draft.txt` em `./challenge/output`, depois renomeie-a para `release ready.txt` e acrescente `review=approved` exatamente uma vez. A saída deve conter as duas linhas da lista de verificação pendente seguidas dessa linha de revisão; o nome do rascunho (draft) deve estar ausente.
4. Um colega relata que a origem escolhida parece desaparecer depois de entrar em `./challenge/output`. Reproduza uma leitura segura de arquivo ausente com um caminho relativo de sua escolha e, então, diagnostique o erro usando observações de localização e de diretórios. Registre o comando que falhou e o status; demonstre leituras corretas com caminho relativo e absoluto sem recriar nem mover a origem. Nenhum comando que falha é fornecido: explique o caminho que você escolheu e por que ele falhou.
5. Mostre que as permissões de criação são restritas, que os nomes de arquivo com espaços permanecem intactos e que uma sobrescrita comum com `>` da origem escolhida é rejeitada. Compare-a novamente com o backup depois disso e inspecione a outra origem em relação ao texto original especificado.

**Entregáveis:** os quatro arquivos inspecionados (dois originais, um backup, uma entrega), o motivo de ter selecionado a lista de verificação pendente, um relato conciso das suas operações, as observações de comparação/status, a leitura que falhou e os caminhos corrigidos, a evidência da proteção contra sobrescrita e o resultado da limpeza. Associe-os a O1–O5. Guarde quaisquer anotações escritas dentro do laboratório; omita prefixos de caminhos pessoais se for discutir com outra pessoa.

**Aceitação:** as cinco condições acima são atendidas, a escolha da entrada é justificada pelo conteúdo, as duas falhas esperadas são explicadas, os dois originais permanecem inalterados e a limpeza é bem-sucedida sem tocar em arquivos que não pertencem ao laboratório. Uma diferença inesperada, evidência ausente, falha sem explicação ou escrita fora do escopo significa **ainda não aprovado**. Resolva o problema e repita as verificações afetadas.

**Dicas opcionais:** esboce primeiro os diretórios desejados; distinga o nome de um arquivo do que o conteúdo dele diz sobre seu uso; crie o backup antes de alterar uma cópia. Verifique os resultados em vez de confiar apenas no sucesso do status dos comandos.

**Próximo passo:** responda às [perguntas da avaliação](#perguntas) e revise os [critérios de conclusão](#critérios-de-conclusão) enquanto os arquivos ainda existem. A limpeza é a verificação prática final.

### Limpeza do desafio

Depois da revisão das evidências, volte à raiz do laboratório e inspecione `./challenge/source`, `./challenge/backup` e `./challenge/output`. Remova os quatro arquivos finais com comandos `rm -i` individuais: `./challenge/source/release checklist.txt`, `./challenge/source/earlier draft.txt`, `./challenge/backup/release checklist.txt` e `./challenge/output/release ready.txt`. Coloque entre aspas cada caminho com espaços. Remova os diretórios filhos, agora vazios, com `rmdir` e depois `./challenge`. Inspecione individualmente quaisquer sobras inesperadas em vez de apagar a árvore inteira. Termine com a [limpeza do laboratório guiado](#limpeza-após-a-avaliação). Uma pessoa revisora deve avaliar suas escolhas e evidências antes que esses artefatos sejam removidos.

## Avaliação de conhecimentos

### Perguntas

Responda às seis perguntas antes de passar para as [orientações de resposta](#orientações-de-resposta). Cada resposta deve explicar o mecanismo e a próxima ação segura, não apenas citar um comando. Mantenha qualquer resposta escrita dentro do laboratório até revisá-la.

1. **Q1 — O1/O3:** Por que `./inbox/service notes.txt` funciona na raiz do laboratório, mas falha dentro de `work`? Como você pode provar que o arquivo ainda existe?
2. **Q2 — O2:** Que evidência distingue copiar, renomear e acrescentar neste exercício?
3. **Q3 — O4:** Por que são necessárias aspas em volta do nome do arquivo de anotações? Nomear um arquivo como `.secret` protege seu conteúdo?
4. **Q4 — O2/O4:** Por que `cp -i` não protege um `printf ... > file` posterior? O noclobber protege um acréscimo?
5. **Q5 — O4:** O que `umask 077` estabelece e o que ele não comprova?
6. **Q6 — O5:** O que deve acontecer se `rmdir` relatar que um diretório não está vazio? O `rm` pode desfazer uma remoção?

### Orientações de resposta

Compare suas explicações com estes pontos depois de responder. Um raciocínio correto equivalente é aceitável; citar um comando sem explicar seu efeito é insuficiente.

- **Q1:** Caminhos relativos começam no diretório de trabalho. Inspecione a localização e o diretório pai, depois use `../inbox/service notes.txt` ou o caminho absoluto registrado. Recriar o arquivo esconderia o erro de caminho.
- **Q2:** O original e o backup ainda são iguais; o nome do rascunho (draft) desapareceu; o arquivo de entrega renomeado existe com uma linha a mais. O status de sucesso de um comando, sozinho, não prova as três condições.
- **Q3:** As aspas mantêm o caminho com espaços como um único argumento. Um nome que começa com ponto afeta apenas as listagens comuns; o que governa o acesso são os controles de acesso, não esconder o nome.
- **Q4:** O shell executa o redirecionamento independentemente do `cp`; `set -C` protege contra a substituição comum de arquivos regulares por meio de `>`, não de `>>`. Inspecione o conteúdo e os backups depois de um erro.
- **Q5:** A máscara restringe os bits de permissão das criações novas naquele shell. Inspecione os modos resultantes. Ela não repara arquivos existentes nem comprova criptografia ou a ausência de permissões adicionais em listas de controle de acesso.
- **Q6:** Inspecione as entradas restantes, inclusive as ocultas, e remova somente arquivos identificados do laboratório. Não force uma exclusão recursiva. A recuperação exige uma cópia intacta ou outro backup; `rm` não tem como desfazer.

Volte às [perguntas](#perguntas) para tentar de novo uma explicação ou continue para os [critérios de conclusão](#critérios-de-conclusão).

## Critérios de conclusão

A conclusão é **autoavaliada**, ou pode ser revisada por um colega com base nos mesmos critérios. Não é uma certificação nem uma competência profissional verificada de forma independente. Ler a página ou reproduzir comandos sem explicar o resultado não conta como conclusão.

| Objetivo | Prática | Avaliação | Evidência necessária | Critério de aprovação |
| --- | --- | --- | --- | --- |
| O1 | Passos 1 e 4 do laboratório | Item 4 do desafio; Q1 | Observações do diretório de trabalho e leituras bem-sucedidas por caminho relativo e absoluto | Os dois caminhos identificam a mesma origem; a pessoa aprendiz explica corretamente seus pontos de partida |
| O2 | Passos 2 e 3 do laboratório; orientação de recuperação | Itens 1–3 do desafio; Q2/Q4 | Motivo da escolha da lista de verificação pendente, comparação entre origem e backup, os dois textos originais, saída final exata, nome do rascunho ausente | A escolha da entrada concorda com o conteúdo; o status da comparação é 0; a saída tem exatamente uma linha de revisão; os dois originais estão inalterados |
| O3 | Passo 4 do laboratório | Item 4 do desafio; Q1 | Comando que falhou, status imediato diferente de zero, diagnóstico e recuperação bem-sucedida | A pessoa aprendiz corrige a referência a partir do diretório filho sem recriar nem mover a origem |
| O4 | Passos 1, 2 e 5 do laboratório | Item 5 do desafio; Q3–Q5 | Nomes de arquivo com espaços intactos, modos de diretório/arquivo, status da sobrescrita rejeitada e comparação após a tentativa | Os bits de modo básicos de grupo/outros estão ausentes; a sobrescrita falha e a origem continua igual ao backup; a pessoa aprendiz explica os limites dos controles |
| O5 | Limpeza guiada e do desafio | Revisão da limpeza; Q6 | Inspeção antes da remoção, alvos exatos da exclusão, observações de diretório vazio e de ausência final | Somente artefatos do laboratório são removidos; o diretório do laboratório está ausente; a pessoa aprendiz explica a recusa e o comportamento de recuperação |

**Aprovação:** todas as linhas passam e toda resposta da avaliação contém o raciocínio da orientação ou uma explicação correta equivalente. Não há pontuação compensatória: uma verificação de segurança ou de limpeza ausente não pode ser compensada por outros sucessos. **Ainda não aprovado:** qualquer linha sem evidência, qualquer origem alterada sem intenção ou qualquer operação que toque em arquivos não relacionados. Se você não conseguir executar uma verificação no seu ambiente, registre-a como não verificada e deixe a conclusão pendente.

Revise O1–O4 e suas explicações antes de apagar os artefatos. Depois, execute a [limpeza do desafio](#limpeza-do-desafio) e a [limpeza do laboratório guiado](#limpeza-após-a-avaliação) e use os resultados para concluir o O5. Não marque o módulo como concluído enquanto a limpeza estiver pendente.

Para remediar, explique o ponto de verificação que falhou e escolha entre [retomar](#retomar-uma-sessão-interrompida), para um espaço de trabalho conhecido, ou uma limpeza inspecionada seguida de [configuração nova](#encontre-um-diretório-inicial). Não repita às cegas comandos de criação ou de acréscimo. Um resultado reparado deve vir acompanhado de evidência de que o ponto de verificação que falhou agora passa.

## Próximos passos

[Acesso Local e Segredos de Teste](local-access-and-secrets.md) baseia-se em arquivos com escopo definido e em permissões. [Gerenciamento de Mudanças Locais com Git](git-change-management.md) baseia-se em preservar, inspecionar e recuperar mudanças. Ambos estão disponíveis, mas a validação deles difere: o Acesso Local e Segredos de Teste tem validação Linux L1 com limitações documentadas, enquanto o Gerenciamento de Mudanças Locais com Git tem apenas validação parcial de uma revisão anterior, e sua revisão atual aguarda revalidação direcionada. Nenhum foi validado em macOS; leia a situação da verificação de cada módulo antes de confiar nas saídas esperadas. Os dois exigem esta competência de forma independente; nenhum é pré-requisito do outro. A [trilha de aprendizagem de Fundamentos](../../../learning-paths/foundations.md) (em inglês) mostra os três módulos e uma ordem sugerida.

Se os caminhos ainda parecerem incertos, desenhe a árvore de diretórios do laboratório e preveja as leituras a partir de cada diretório filho antes de executá-las. Se as verificações de segurança parecerem mecânicas, explique o que cada uma protege e o que deixa desprotegido. Para contribuir com melhorias neste módulo, use o [guia de autoria do currículo](../../../curriculum-authoring-guide.md) (em inglês).
