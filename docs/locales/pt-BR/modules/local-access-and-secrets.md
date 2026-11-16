# Acesso Local e Segredos de Teste

## Visão geral

**Competência:** `local-access-and-secrets` · **Nível:** Fundamentos · **Revisão da avaliação:** 1

Um worker fictício (um processo de serviço que roda em segundo plano) precisa ler sua configuração, enquanto um leitor de suporte precisa apenas de um breve relatório de status. Configure os arquivos locais para essas finalidades, investigue um problema de acesso e justifique quais informações devem entrar no relatório. Nenhum serviço é instalado ou iniciado: sua conta de usuário comum representa o operador, e a leitura de um arquivo representa a operação de leitura do worker. Isso não modela identidades de serviço separadas.

Siga **Aprender → Praticar → Construir → Validar**: aprenda o modelo de acesso, conclua a prática guiada, tome de forma independente uma decisão de divulgação e revise a evidência de cada objetivo antes da limpeza.

**Situação da verificação:** os recursos indicados abaixo foram acessados e revisados em **2026-11-12**. Os comandos passaram por revisão de documentação, segurança, portabilidade e sintaxe de shell; o laboratório e o desafio **não foram executados**. O comportamento em Linux/macOS, as permissões efetivas, a recuperação após interrupção e a limpeza ainda aguardam validação prática. Os pontos de verificação descrevem resultados esperados ou condicionais, não resultados de execução registrados.

*Nota sobre os blocos de código: comandos, comentários e saídas de exemplo permanecem em inglês, exatamente como no módulo canônico, para que você possa compará-los com manuais e com o que o seu terminal mostra. O texto em português ao redor explica o que cada bloco faz. Neste módulo, “sintético” significa fictício: criado apenas para o exercício e sem valor real.*

## Por que isso importa

Um arquivo de configuração pode conter informações que um relatório de diagnóstico não precisa. Tornar um arquivo legível por todos pode esconder um problema de acesso e, ao mesmo tempo, expor essas informações. Por outro lado, remover todo o acesso pode interromper um trabalho útil sem explicar a causa.

Use duas perguntas em conjunto: **quem precisa de qual operação?** e **de quais informações o destinatário precisa?** As permissões de arquivo respondem à primeira pergunta. A escolha deliberada do conteúdo do relatório responde à segunda. Um modo de arquivo restritivo não torna apropriada uma divulgação desnecessária.

## Pré-requisitos

Competência obrigatória: [Operações Seguras com Arquivos no Terminal](../../../modules/terminal-file-operations.md) (módulo em inglês). Antes de começar, você deve ser capaz de identificar sua localização, colocar um caminho entre aspas, criar e inspecionar arquivos sintéticos, interpretar imediatamente um status de saída e remover apenas artefatos conhecidos do laboratório. Se precisar, use a [orientação sobre diretório inicial](../../../modules/terminal-file-operations.md#find-a-starting-directory) desse módulo. Não é necessário conhecer Git.

Ambiente necessário:

- Um terminal local Linux ou macOS com `/bin/sh`, os utilitários padrão do pré-requisito e também `id`, `chmod` e `grep`. O uso deles é explicado aqui. Não é necessário instalar nenhum pacote.
- Uma sessão comum, sem privilégios administrativos, e um diretório pessoal existente e gravável em um sistema de arquivos local com permissões Unix. Evite diretórios compartilhados, sincronizados, de produção e de repositórios.
- Um espaço de trabalho descartável contendo apenas arquivos que você criar para esta lição. Não importe arquivos pessoais, links simbólicos, árvores de diretórios existentes nem credenciais. Todos os arquivos de exercício e relatórios ficam dentro desse espaço de trabalho; a leitura da identidade do sistema e o uso de `/dev/null` não modificam a configuração do sistema.

Não há contas de nuvem, serviços externos, cobranças de infraestrutura, usuários adicionais nem etapas administrativas. Não use `sudo`, não altere a propriedade, não modifique configurações globais, não altere permissões de forma recursiva e não use `source` em um arquivo de configuração. Os comandos buscam um uso compatível com POSIX em Linux/macOS; listagens, mensagens de erro, recursos do sistema de arquivos e políticas de acesso variam. Não trate uma mensagem de erro específica como garantida.

Se o sistema de arquivos não conseguir representar os modos esperados, se a propriedade for inesperada ou se listas de controle de acesso (ACLs) ou políticas da organização tornarem o exercício pouco claro, pare e registre a limitação. Use um ambiente apropriado, com orientação, em vez de alterar a política do sistema. Execute os blocos em ordem, inspecione cada ponto de verificação e pare diante de falhas inesperadas; não cole o módulo inteiro como se fosse um script.

## Objetivos de aprendizagem

- **O1 — Interpretar:** identificar o proprietário, o grupo e as classes básicas de permissão de arquivos e diretórios do laboratório; explicar leitura, escrita e execução/busca para cada tipo de objeto.
- **O2 — Restringir:** configurar uma configuração sintética de serviço somente para leitura e diretórios de trabalho privados, verificar seus modos e explicar por que o `umask` não corrige arquivos existentes.
- **O3 — Diagnosticar:** comparar uma leitura bem-sucedida com uma tentativa de acesso controlada, registrar o que realmente acontece, restaurar apenas o acesso necessário e distinguir a inspeção da configuração da evidência de imposição.
- **O4 — Separar:** produzir um relatório que contenha apenas fatos autorizados, excluir segredos sintéticos e detalhes internos desnecessários, e justificar a decisão de divulgação e seus limites.
- **O5 — Limpar:** inspecionar e remover apenas artefatos do próprio laboratório, verificar que o espaço de trabalho foi removido e explicar por que a remoção não revoga uma credencial exposta nem prova apagamento seguro.

## Conceitos fundamentais

### A propriedade define a classe de acesso

Cada arquivo e cada diretório tem um usuário proprietário e um grupo proprietário. `id` descreve o usuário e os grupos do seu processo; `id -u` imprime o ID de usuário efetivo. `ls -ld` descreve o próprio diretório; `ls -l` descreve as entradas de arquivo. Os nomes de proprietário e de grupo nessas listagens são informações pessoais: inspecione-os localmente, não em uma transcrição pública. Veja [POSIX id](https://man7.org/linux/man-pages/man1/id.1p.html).

Leia um modo como `-rw-------` como um tipo de entrada seguido de três grupos de permissão: proprietário, grupo e outros. Aqui, o proprietário tem leitura e escrita; o grupo e os outros não têm nenhuma. A letra `d` no lugar do `-` inicial indica um diretório. As verificações básicas selecionam a classe do proprietário, se você for o proprietário; do contrário, uma classe de grupo aplicável; do contrário, a classe de outros. Elas não simplesmente somam as três classes. Grupos suplementares podem ser relevantes. A [referência de resolução de caminhos do Linux](https://man7.org/linux/man-pages/man7/path_resolution.7.html) explica esse modelo e as exceções de privilégio específicas do Linux. Nós inspecionamos a propriedade; não a alteramos.

Por exemplo, as saídas a seguir são **sintéticas**: não são comandos para colar nem resultados de um laboratório executado. Nomes, números, datas e espaçamento no seu computador serão diferentes:

```text
$ id
uid=1001(learner) gid=1001(lab) groups=1001(lab),1002(observers)
$ ls -l ./private/service.conf
-rw------- 1 learner observers 80 Nov 12 12:00 ./private/service.conf
```

- **Identidade atual:** `1001` é o ID numérico do usuário; `learner` é o nome dele. A identidade de usuário efetiva é a identidade que um processo usa nas verificações de acesso comuns. Nesta sessão comum, ela coincide com a identidade de login. Quando os IDs real e efetivo diferem, `id` também mostra o ID efetivo; `id -u` o seleciona diretamente. Trocar de identidade está fora desta lição.
- **Grupos:** `lab` é aqui o grupo primário atual. Grupos suplementares são participações adicionais que podem entrar nas verificações de acesso de grupo; `observers` é um deles. Um grupo é uma forma de associar contas a uma classe de acesso compartilhada, não uma identidade de usuário separada.
- **Propriedade do arquivo:** depois do modo e da contagem de links (`1`), `ls -l` mostra o proprietário `learner` e o grupo do arquivo `observers`. Os campos seguintes são tamanho, data e hora, e caminho. O grupo do arquivo não precisa coincidir com o seu grupo primário.

Relacione as duas saídas: o usuário atual é o proprietário deste arquivo, portanto os bits de proprietário `rw-` se aplicam no modelo básico. Ser membro de `observers` não os substitui pelos `---` do grupo. Para uma identidade diferente, que não seja a proprietária, a participação no grupo correspondente selecionaria os bits de grupo; caso contrário, valeriam os bits de outros. Use as observações reais no laboratório, sem criar esses usuários e grupos de exemplo.

### As mesmas letras significam operações diferentes

Estes são os significados comuns das permissões; o acesso ao caminho e controles adicionais continuam valendo.

| Permissão | Arquivo regular | Diretório |
| --- | --- | --- |
| Leitura (`r`) | Ler o conteúdo | Listar os nomes das entradas; isso, por si só, não concede acesso ao conteúdo nem aos metadados delas |
| Escrita (`w`) | Modificar ou truncar o conteúdo | Alterar entradas, incluindo criá-las, removê-las ou renomeá-las; o uso comum também exige permissão de busca no diretório |
| Execução (`x`) | Permitir a execução como programa, sujeita ao formato e a outras verificações | Buscar/atravessar o diretório, incluindo acessar o nome de um item filho já conhecido; isso, por si só, não lista nomes |

Um arquivo não precisa do bit de execução para guardar dados de configuração. Dar a um diretório permissões de leitura e escrita como se fosse um arquivo, sem busca, pode tornar seus itens filhos inacessíveis. O caminho de um item filho conhecido pode ser utilizável sem permissão para listar os nomes de todos os seus irmãos. O acesso a um arquivo aninhado também depende da permissão de busca ao longo do caminho.

A permissão de escrita em um arquivo não é a mesma coisa que a permissão para excluir o seu nome. As permissões do diretório governam a remoção, com restrições adicionais, como o sticky bit (um bit especial de diretório que restringe quem pode remover ou renomear as entradas) ou regras de controle de acesso. Um arquivo somente para leitura pode, portanto, ainda ser removível. Veja as [regras de abertura de diretórios](https://man7.org/linux/man-pages/man3/fdopendir.3p.html) e as [regras de remoção](https://man7.org/linux/man-pages/man3/unlink.3p.html) do POSIX; são referências opcionais, não pré-requisitos de programação em C.

### O menor privilégio depende da tarefa

O menor privilégio (*least privilege*) consiste em conceder apenas o acesso que a tarefa exige. Nossa política é o acesso exclusivo do proprietário. Os diretórios de trabalho precisam de `rwx` para inspeção, travessia e gerenciamento de entradas. Uma configuração já preparada precisa apenas de leitura para o proprietário; relatórios editáveis precisam de leitura e escrita para o proprietário. Outras contas não têm nenhum papel nesta simulação local. Que um relatório seja adequado para um destinatário **não** exige torná-lo legível por todos nem enviá-lo a algum lugar.

[`chmod`](https://man7.org/linux/man-pages/man1/chmod.1p.html) altera o modo de um objeto existente. As formas simbólicas indicam uma classe (`u`, `g`, `o`) e uma operação: `u-r` remove a leitura do proprietário; `u+r` a restaura. Os modos numéricos atribuem bits de permissão: leitura vale 4, escrita 2 e execução/busca 1 em cada classe. Assim, `700` é `rwx` para o proprietário, `600` é `rw` para o proprietário e `400` é `r` para o proprietário, sem nenhum acesso básico para grupo/outros. Use alvos explícitos do laboratório e depois inspecione; o status de sucesso do comando, sozinho, não basta. A propriedade permite que um proprietário comum altere o modo do seu arquivo mesmo depois de remover o bit de leitura, desde que o caminho continue acessível. Nunca adicione acesso amplo apenas para silenciar um erro.

### Os valores padrão de criação não corrigem arquivos existentes

[`umask`](https://man7.org/linux/man-pages/man1/umask.1p.html) remove bits de permissão do modo de criação solicitado por um programa. Quando a criação comum de texto pelo shell solicita `666`, `077` resulta em `600`; quando a criação de diretório solicita `777`, resulta em `700`. Trata-se de remoção de bits, não de uma regra geral de subtração aritmética, e não pode adicionar permissões que o programa não solicitou. Veja a [descrição de criação de arquivos](https://man7.org/linux/man-pages/man3/open.3p.html) do POSIX.

A máscara se aplica às criações seguintes naquele shell e em seus processos filhos. Ela não altera um arquivo existente, não corrige uma lista de controle de acesso nem criptografa o conteúdo. Defina-a antes da criação, inspecione os resultados e use uma alteração de modo deliberada para os arquivos existentes do laboratório. Mantemos essa configuração em um shell filho, em vez de editar perfis do shell. `set -C` (a opção `noclobber` do shell), trazido do pré-requisito, protege separadamente contra sobrescritas por redirecionamento comum; não é um controle de confidencialidade.

### Inspeção e imposição respondem a perguntas diferentes

`ls` mostra os modos básicos configurados. Uma leitura real testa uma operação feita por um processo naquele momento. Uma leitura bem-sucedida do proprietário não prova que outros usuários estão bloqueados. Remover o bit de leitura do proprietário também não estabelece que todo ambiente rejeitará a próxima leitura: privilégios, comportamento do sistema de arquivos e controles adicionais podem afetar o resultado. As listas de controle de acesso (ACLs) podem expressar regras além das três classes básicas. Sufixos de listagem como `+` ou `@` são indicadores, específicos de cada plataforma, de metadados adicionais, não um veredito universal sobre segurança.

As permissões básicas não isolam programas executados com a mesma identidade permitida, não apagam cópias já feitas nem fornecem criptografia. Esta lição não audita ACLs, acessos privilegiados, backups nem um serviço multiusuário. Ela testa operações delimitadas e exige um relato explícito quando a negação esperada não puder ser demonstrada. Não crie outro usuário nem escale privilégios para forçar um resultado.

### Minimize as evidências que você compartilha

Um segredo é uma informação cuja divulgação pode permitir acesso ou outra ação sensível. Aqui, todo token (uma cadeia de texto que funciona como senha de acesso a um serviço) começa com `SYNTHETIC-NOT-A-CREDENTIAL-` e não consegue se autenticar em nenhum serviço real. Nunca substitua esses tokens por valores reais. Um nome de arquivo oculto não é proteção, e um relatório chamado “seguro” ainda pode conter um segredo.

Monte um relatório a partir de uma **lista de permissão** (*allowlist*): o conjunto pequeno de fatos que o destinatário está autorizado a receber. Evite copiar configurações inteiras e tentar remover algumas chaves suspeitas. Um token pode aparecer em uma observação comum, sob outra chave. Uma busca literal é útil para o nosso marcador sintético conhecido, mas não consegue certificar que um material arbitrário está livre de segredos. Revise cada campo e o relatório completo.

O [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) explica o menor privilégio e a revogação de segredos. Diante de uma suspeita real de exposição, siga o processo de incidentes do responsável e revogue ou substitua a credencial afetada conforme apropriado. Restringir permissões ou excluir uma cópia local não desfaz a divulgação. Praticamos a decisão apenas com dados sintéticos. Não coloque segredos reais em argumentos de comandos, na saída do terminal, em capturas de tela nem no histórico do shell; alterar as configurações de histórico não garante que outro software não registre os dados.

Trate a configuração como dado. Executar `. arquivo`, `source arquivo` ou um shell sobre ela pode executar o seu conteúdo; nada disso é necessário aqui. Nossa sonda de leitura usa `cat arquivo > /dev/null` para descartar os bytes em vez de imprimir o token. Isso prova somente que o arquivo é legível, não que a configuração é válida, que há autenticação ou que existe um serviço em execução.

## Recursos recomendados

Todos os recursos abaixo foram abertos e seu conteúdo relevante foi inspecionado em **2026-11-12**. Eles podem ser lidos gratuitamente, sem conta. Este laboratório não exige infraestrutura paga. As páginas POSIX são o texto **POSIX.1-2017 / Issue 7, edição de 2018**, do IEEE/The Open Group, reproduzido em man7.org, e não testes ao vivo das ferramentas instaladas. O acesso direto ao Open Group falhou com HTTP 403 durante a preparação; as requisições aos manuais do GNU expiraram. Nenhuma das duas fontes indisponíveis está marcada aqui como verificada.

| Recurso e publicador | Leitura selecionada e objetivos | Escopo e limites |
| --- | --- | --- |
| [POSIX id](https://man7.org/linux/man-pages/man1/id.1p.html) e [chmod](https://man7.org/linux/man-pages/man1/chmod.1p.html) — IEEE/The Open Group, reproduzidos em man7.org | Identidade, alvos explícitos, modos simbólicos e numéricos; O1–O3 | Definições do padrão; mecanismos adicionais de controle de acesso podem variar conforme a implementação |
| [POSIX umask](https://man7.org/linux/man-pages/man1/umask.1p.html) e [open](https://man7.org/linux/man-pages/man3/open.3p.html) — mesma atribuição | Máscaras de criação e modos de arquivo solicitados; O2 | Leia a descrição da máscara; não é necessário programar em C nem usar chamadas de sistema |
| [POSIX opendir/fdopendir](https://man7.org/linux/man-pages/man3/fdopendir.3p.html) e [unlink](https://man7.org/linux/man-pages/man3/unlink.3p.html) — mesma atribuição | Leitura de diretórios e permissões de remoção; O1/O5 | Referência opcional sobre o mecanismo, especialmente as condições de erro de acesso |
| [path_resolution](https://man7.org/linux/man-pages/man7/path_resolution.7.html) — projeto Linux man-pages | Busca de caminhos, classes de permissão e desvio por privilégio; O1/O3 | Texto do Linux man-pages 6.19 inspecionado; os detalhes do Linux não são uma garantia para o macOS |
| [POSIX grep](https://man7.org/linux/man-pages/man1/grep.1p.html) — IEEE/The Open Group, reproduzido em man7.org | Contagem de cadeias fixas e distinções entre status de saída; O4 | Uma verificação de marcador conhecido, não um detector geral de segredos |
| [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — OWASP | Seções 2.3 e 2.7.3 sobre controle de acesso e revogação; O4/O5 | Orientação em evolução, revisada na data acima; serviços externos e arquiteturas avançadas estão fora deste laboratório |

Consulte os manuais locais do seu ambiente instalado. A verificação das fontes e a revisão de sintaxe são distintas da execução do exercício; nenhuma delas estabelece compatibilidade em tempo de execução com Linux/macOS.

## Laboratórios práticos

### Prática: inspecionar a configuração de um worker fictício

**Objetivo:** estabelecer um espaço de trabalho privado, preparar uma configuração somente para leitura, investigar uma falha de leitura controlada e preparar um relatório mínimo. Objetivos de aprendizagem: O1–O5. Todos os valores e observações dizem respeito ao `demo-worker` fictício; nenhum worker real é executado.

#### 1. Estabeleça o limite

Use a [orientação sobre diretório inicial](../../../modules/terminal-file-operations.md#find-a-starting-directory) do pré-requisito para entrar em um diretório pessoal local existente. Confirme com `pwd -P` e `ls -ld .`. Esse é o diretório pai de um novo espaço de trabalho, não um alvo de alteração de permissões. Inicie um shell filho:

```sh
env ENV= HISTFILE= /bin/sh
```

Essas configurações de ambiente valem apenas para esse shell e evitam um arquivo de inicialização `ENV` e um nome de arquivo de histórico persistente; não são uma sandbox de segurança. No shell filho, inspecione a identidade:

```sh
id
id -u
```

**Ponto de verificação:** use sua conta comum. Se o ID efetivo for `0`, pare; use uma sessão de terminal comum. Um ID diferente de zero, sozinho, não prova a ausência de outros privilégios. Não altere a configuração da conta. Mantenha a saída de identidade privada.

Agora execute este auxiliar de preparação. Ele registra um espaço de trabalho somente depois de uma criação nova e de uma entrada bem-sucedida. Se a preparação falhar, o shell continua aberto para inspeção.

```sh
umask 077
set -C
unset access_lab_root
if mkdir ./local-access-and-secrets-lab &&
   cd ./local-access-and-secrets-lab &&
   access_lab_root=$(pwd -P); then
  printf 'Lab root: %s\n' "$access_lab_root"
  ls -ld .
else
  printf '%s\n' 'STOP: setup failed. Inspect before continuing.'
fi
```

**Ponto de verificação:** registre o caminho físico em particular; ele deve identificar o `local-access-and-secrets-lab` recém-criado. Espere o modo de diretório `drwx------` e a sua propriedade. `mkdir` sem `-p` recusa um nome existente. Não exclua um diretório existente para forçar a preparação; use outro diretório pai adequado ou [retome o seu laboratório conhecido](#retomar-uma-sessão-interrompida). Se a propriedade, o modo ou o local estiver errado, pare antes de criar qualquer conteúdo.

#### 2. Crie a configuração sintética e inspecione o acesso

Na raiz verificada do laboratório, crie dois diretórios de trabalho e uma configuração sintética:

```sh
mkdir ./private ./reports
printf '%s\n' 'service=demo-worker' 'api_token=SYNTHETIC-NOT-A-CREDENTIAL-ALPHA' 'mode=training' > ./private/service.conf
ls -ld . ./private ./reports
ls -l ./private/service.conf
umask
cat ./private/service.conf > /dev/null
printf 'Initial read status: %s\n' "$?"
```

**Ponto de verificação:** os diretórios têm o modo básico `700`; a configuração tem `600`. Identifique o proprietário e o grupo deles nas listagens e compare a propriedade com `id`. Os nomes de grupo podem refletir a herança do diretório; não presuma um nome de grupo específico nem o altere. A máscara deve representar `077`, embora a formatação possa diferir. A leitura inicial deve retornar `0`. Se não retornar, investigue o local, o caminho, a propriedade e o ambiente antes de introduzir a falha intencional.

Explique por que `private` precisa de permissão de busca, além de leitura; por que editar as suas entradas exige permissão de escrita; e por que o arquivo de texto não precisa do bit de execução. Não trate a saída de `ls` como um formato portável para análise automática; leia-a você mesmo.

#### 3. Aplique a política somente para leitura

A configuração está preparada e, no restante do exercício, só precisa ser lida. Remova a permissão de escrita do proprietário atribuindo explicitamente o modo final:

```sh
chmod 400 ./private/service.conf
ls -l ./private/service.conf
umask 077
ls -l ./private/service.conf
cat ./private/service.conf > /dev/null
printf 'Read-only configuration status: %s\n' "$?"
```

**Ponto de verificação:** as duas listagens mostram `-r--------` e a leitura é bem-sucedida. Aplicar a máscara de criação novamente não fez o arquivo existente voltar a ser `600`. Explique por que os diretórios continuam `700`, por que a configuração pode ser `400` e por que um relatório que você ainda está preparando pode ser `600`. Essas são escolhas específicas da tarefa, não padrões universais de produção. A inspeção do modo é uma verificação de configuração, não prova de que todas as outras identidades estão excluídas.

#### 4. Compare uma tentativa de acesso e recupere

Permaneça na raiz do laboratório. Você removerá somente o bit de leitura do proprietário do arquivo sintético. Os diretórios pai continuam acessíveis, portanto o proprietário pode restaurar o modo do arquivo. Não escreva no arquivo enquanto ele estiver ilegível.

```sh
chmod u-r ./private/service.conf
ls -l ./private/service.conf
cat ./private/service.conf > /dev/null
printf 'Restricted read status: %s\n' "$?"
```

**Inspecione antes de diagnosticar:** o modo básico configurado agora deve ser `----------`. Registre a listagem, o diagnóstico real e o status imediato. Com uma conta sem privilégios, em um sistema de arquivos com permissões Unix comuns, espera-se que a nova leitura seja negada. A redação exata não é prescrita. Um status diferente de zero, sozinho, não estabelece que a causa foram as permissões: compare o mesmo caminho antes legível, a alteração de modo bem-sucedida e o diagnóstico. Um erro de caminho inexistente é uma falha diferente.

| Observação | Interpretação e próxima ação |
| --- | --- |
| O modo mudou; o arquivo antes legível agora informa uma negação de acesso | Evidência para esta tentativa de leitura com a identidade atual. Explique o bit alterado e depois restaure, como abaixo. |
| A leitura é bem-sucedida apesar do modo restritivo esperado | A imposição esperada não foi demonstrada. Registre esse fato; restaure como abaixo e busque orientação sobre o ambiente. Não afirme que houve negação nem tente alterações mais fortes no sistema. |
| `chmod` falha, o modo é inesperado ou a leitura informa outro erro | A preparação da falha ou o ambiente continua sem solução. Inspecione o local, a propriedade e o caminho exato. Não conte isso como um teste de negação de acesso. |

Restaure somente o bit de leitura e depois verifique o modo e o funcionamento:

```sh
chmod u+r ./private/service.conf
ls -l ./private/service.conf
cat ./private/service.conf > /dev/null
printf 'Recovered read status: %s\n' "$?"
```

**Ponto de verificação:** o modo voltou a ser `400` e o status da leitura é `0`. Explique por que restaurar a leitura não exigiu permissão de escrita nem de execução no arquivo. Registre a sequência antes/tentativa/depois sem o conteúdo do arquivo. Se a restauração falhar, pare e use a [orientação de recuperação](#retomar-uma-sessão-interrompida). Se a negação não foi demonstrada, a inspeção da configuração ainda pode ser registrada, mas o critério de imposição do O3 continua **não verificado**; você pode estudar os conceitos seguintes e fazer a limpeza, mas não declarar a conclusão completa.

#### 5. Prepare apenas o relatório de que o destinatário precisa

O leitor de suporte fictício está autorizado a receber o nome do serviço, o resultado da leitura local recuperada e a confirmação de que as credenciais foram omitidas. Ele não precisa do token, de uma cópia da configuração, de nomes de usuário, de caminhos absolutos nem da saída bruta de identidade. Não existe destinatário real nem envio.

Depois que a leitura recuperada for bem-sucedida, crie o relatório a partir desses fatos permitidos:

```sh
printf '%s\n' 'service=demo-worker' 'check=config-readable' 'credential=omitted' > ./reports/status.txt
ls -l ./reports/status.txt
cat ./reports/status.txt
grep -F -c 'SYNTHETIC-NOT-A-CREDENTIAL-' ./reports/status.txt
printf 'Marker-search status: %s\n' "$?"
```

**Ponto de verificação:** o arquivo tem o modo `600` e exatamente as três linhas especificadas. `grep -F` busca texto literal; `-c` imprime a contagem de linhas que coincidem, em vez da linha em si. Nesta verificação, espere a contagem `0` e o status `1` (nenhuma correspondência). O status `0` significa que o marcador foi encontrado e o relatório falha; um status maior que `1` é um erro da verificação, não um resultado limpo. Investigue um relatório ilegível ou ausente em vez de tratar todo status diferente de zero como sucesso.

Leia também o relatório inteiro em comparação com a lista de permissão. A ausência deste único marcador não detecta outros segredos, campos renomeados, valores parciais nem dados pessoais. O relatório continua privado localmente, embora o conteúdo seja adequado ao leitor indicado. Isso **não** é evidência de que um serviço foi iniciado nem de que o teste anterior de leitura negada foi aprovado.

Se um relatório contiver conteúdo não intencional, mantenha-o privado, inspecione-o, remova somente esse relatório sintético conhecido com `rm -i ./reports/status.txt` e recrie-o a partir dos fatos permitidos. Não contorne o noclobber nem acrescente uma correção a um relatório que já divulga informações. Explique por que isso repara este artefato sintético, mas não revogaria uma credencial real exposta.

#### 6. Revise antes de remover

Mantenha o mesmo shell e o mesmo espaço de trabalho para o [desafio independente](#desafios-práticos). Responda às [perguntas](#perguntas), compare com as [orientações de resposta](#orientações-de-resposta) e revise os [critérios de conclusão](#critérios-de-conclusão) enquanto os artefatos ainda existem. Depois faça a [limpeza](#limpeza-após-a-avaliação). Quaisquer anotações privadas devem ficar dentro do laboratório e conter observações, não valores secretos. Você também pode limpar uma tentativa incompleta; isso não estabelece a conclusão.

#### Retomar uma sessão interrompida

Não execute novamente os blocos de preparação ou de criação sobre um laboratório existente. Se o shell filho continuar aberto e `access_lab_root` for válido, volte à raiz registrada e inspecione o estado. Se o shell foi fechado, inicie um novo shell filho com `env ENV= HISTFILE= /bin/sh` antes do bloco de restauração abaixo. Não aninhe shells sem necessidade.

Substitua o marcador entre aspas pelo **caminho físico exato do laboratório que você registrou**. O marcador é deliberadamente inutilizável. Se você não conseguir identificar o seu espaço de trabalho, pare em vez de adivinhar.

```sh
unset access_lab_root
if cd '/replace-with-your-recorded-path/local-access-and-secrets-lab' &&
   access_lab_root=$(pwd -P); then
  umask 077
  set -C
  printf 'Resumed lab root: %s\n' "$access_lab_root"
  id
  ls -ld .
  ls -a .
else
  unset access_lab_root
  printf '%s\n' 'STOP: the recorded lab could not be opened.'
fi
```

Confirme a mesma identidade comum, o local registrado, a propriedade, o modo da raiz e as entradas reconhecíveis antes de prosseguir. Inspecione individualmente os diretórios filhos e os arquivos nomeados existentes; não siga links simbólicos desconhecidos nem repare objetos desconhecidos. O exercício nunca remove a busca de seus diretórios.

| Estado interrompido | Recuperação segura |
| --- | --- |
| A preparação ou a criação foi parcial | Inspecione o que existe; crie somente os artefatos especificados que faltam. O noclobber deve recusar a substituição de arquivos existentes. |
| A configuração guiada está em `600` | Ela pode estar aguardando a política somente para leitura. Inspecione o estado da preparação e continue a partir do passo 3. |
| A configuração guiada está em `000` após a falha controlada | Depois de confirmar a identidade dela e o caminho do diretório pai, use a recuperação `chmod u+r` do passo 4. Inspecione o `400` e tente a leitura novamente. Um estado recuperado não prova que uma negação anterior ocorreu. |
| A configuração guiada está em `400` | Repita as observações de somente leitura; não repita a criação nem conclua que terminou apenas pelo modo. |
| O relatório já existe | Inspecione todo o conteúdo e os modos dele e depois repita a validação. Não acrescente um segundo relatório. Use a orientação de substituição do passo 5 somente se necessário. |
| Existe trabalho do desafio | Inspecione as entradas e a saída nomeadas; preserve o texto original das entradas. Se a configuração identificada foi deixada em `000` ou `200` pela falha escolhida, restaure somente esse arquivo com `chmod 400 ./challenge/private/service.conf`, inspecione o modo e tente a leitura novamente. Não conclua que a negação foi observada; repita as observações que faltam antes de retomar o primeiro requisito não concluído. |
| O acesso ao diretório está bloqueado de forma inesperada ou a identidade não é familiar | Pare. Não use alterações recursivas de permissão, alterações de propriedade nem escalação de privilégios. Registre a limitação e obtenha orientação específica para o ambiente. |

Se o texto de entrada sintético foi alterado acidentalmente e não é mais confiável, inspecione e limpe a tentativa conhecida e depois comece de novo; não invente evidência de preservação. Registre de qual ponto de verificação você retomou e repita as observações que não guardou. As configurações do shell não reparam artefatos existentes.

#### Limpeza após a avaliação

Revise primeiro as evidências. A exclusão é a remoção permanente destes nomes, não a Lixeira da área de trabalho nem um apagamento seguro. Nada aqui exige alterar as permissões do diretório pai nem de outros arquivos pessoais.

Use este auxiliar para exigir um caminho registrado não vazio antes de entrar nele. Confirme que o caminho físico impresso corresponde ao laboratório que você registrou e inspecione o conteúdo. Se algo for desconhecido ou se o auxiliar falhar, pare antes de remover qualquer coisa.

```sh
if test -n "$access_lab_root" &&
   cd "$access_lab_root" &&
   test "$(pwd -P)" = "$access_lab_root"; then
  pwd -P
  ls -a .
else
  printf '%s\n' 'STOP: workspace verification failed. Do not remove anything.'
fi
```

Se você criou artefatos do desafio, siga primeiro a [limpeza do desafio](#limpeza-do-desafio). Inspecione quaisquer anotações extras do laboratório pelo nome exato e remova-as individualmente. Na raiz verificada, inspecione `./private` e `./reports`. Depois execute estas remoções uma de cada vez, confirmando cada alvo somente quando tiver certeza:

```sh
rm -i ./reports/status.txt
rm -i ./private/service.conf
rmdir ./reports ./private
ls -a .
```

Em uma tentativa parcial, remova apenas os artefatos que existem. Uma configuração somente para leitura ou ilegível ainda pode, normalmente, ser removida do seu diretório pai gravável e com permissão de busca; a permissão de escrita no arquivo não é o controle da exclusão. Se a remoção falhar, inspecione a causa real. Não amplie permissões nem adicione opções recursivas ou de força. A recusa de um diretório não vazio é um motivo para inspecionar o que sobrou, inclusive entradas ocultas, não para apagar a árvore.

**Ponto de verificação:** somente `.` e `..` permanecem na raiz do laboratório. Este auxiliar final verifica o local novamente antes de sair e remove o diretório vazio exato que foi registrado. O sucesso e a saída do shell exigem tanto a remoção quanto uma verificação de ausência:

```sh
if test -n "$access_lab_root" &&
   test "$(pwd -P)" = "$access_lab_root" &&
   cd .. &&
   rmdir "$access_lab_root" &&
   test ! -e "$access_lab_root"; then
  printf '%s\n' 'Lab directory removed.'
  exit
else
  printf '%s\n' 'STOP: cleanup is incomplete. Inspect before retrying.'
fi
```

Em caso de falha, o shell continua aberto. Inspecione `pwd -P`: você pode estar agora no diretório pai. Se o laboratório registrado ainda existir, inspecione-o, volte a ele e remova somente as sobras identificadas antes de tentar de novo. Se a variável estiver ausente, use o procedimento de retomada; nunca adivinhe um caminho para exclusão. Em caso de sucesso, o shell pai mantém as configurações anteriores. Registre a observação da limpeza e conclua o O5 nos [critérios de conclusão](#critérios-de-conclusão). Não conclua que backups, gravações do terminal ou cópias anteriores em outros lugares foram apagados.

## Desafios práticos

### Construir: escolher uma resposta de suporte segura

Uma solicitação de suporte fictícia pergunta se o `demo-worker` consegue ler a sua configuração. Uma pessoa propõe anexar um rascunho de diagnóstico, enquanto outra sugere conceder leitura a todos para evitar falhas futuras. Decida como responder com o mínimo de acesso e de informação necessários. O leitor de suporte está autorizado a receber **somente o nome do serviço, o resultado final observado da leitura e uma declaração de que os detalhes confidenciais foram omitidos**.

Use um novo diretório `./challenge` dentro do mesmo laboratório verificado. Não execute a preparação novamente se ele já existir; inspecione/retome. O que segue são **entradas sintéticas fornecidas**, não uma receita de solução. Com `umask 077` e `set -C` ativos, crie-as uma única vez, parando diante de qualquer falha:

```sh
mkdir ./challenge && mkdir ./challenge/private ./challenge/reports
printf '%s\n' 'service=demo-worker' 'api_token=SYNTHETIC-NOT-A-CREDENTIAL-BETA' 'mode=training' > ./challenge/private/service.conf
printf '%s\n' 'service=demo-worker' 'question=can-the-configuration-be-read' > ./challenge/private/request.txt
printf '%s\n' 'service=demo-worker' 'context=SYNTHETIC-NOT-A-CREDENTIAL-BETA' 'internal_note=operator-only' > ./challenge/private/diagnostic-draft.txt
ls -ld ./challenge ./challenge/private ./challenge/reports
ls -l ./challenge/private/service.conf ./challenge/private/request.txt ./challenge/private/diagnostic-draft.txt
```

**Ponto de verificação das entradas:** os diretórios são `700`, os arquivos `600`, todos pertencentes à sua identidade comum. Inspecione localmente os três arquivos em comparação com o texto fornecido; estes valores são falsos. Uma transcrição completa do terminal não é uma resposta de suporte. Preserve os três textos de entrada durante toda a avaliação; as alterações de modo na configuração são permitidas.

Use a sua própria sequência de comandos e apresente estes resultados:

1. **Interpretar e planejar (O1/O2):** explique os proprietários, os grupos e as operações necessárias para cada objeto. Apresente um plano final de permissões: diretórios `700`, configuração somente para leitura `400`, requisição/rascunho e resposta editável `600`. Classifique os campos do rascunho em relação às informações autorizadas para o destinatário, mesmo que ele não tenha um campo `api_token`. Não é necessário nenhum acesso de grupo ou de outros.
2. **Diagnosticar e recuperar (O3):** estabeleça uma leitura bem-sucedida da configuração e depois escolha uma alteração **somente no bit de leitura do proprietário desse arquivo** que deva bloquear uma nova leitura. Não altere diretórios nem conceda novos acessos. Registre o modo, o status e o diagnóstico reais, explique a causa ou a limitação do ambiente e restaure a política final `400`. Aplique as mesmas regras de imposição do passo 4 da prática guiada; não fabrique uma negação. Uma leitura final bem-sucedida é obrigatória, mas não pode substituir a falta de evidência de negação.
3. **Escolher a divulgação (O4):** decida se o anexo proposto e a alteração ampla de permissões atendem à solicitação. Crie `./challenge/reports/response.txt` somente com os três fatos autorizados. O resultado da leitura deve refletir a sua observação. Mantenha o raciocínio separado, em anotações privadas, ou explique-o oralmente; não coloque tokens, observações internas, nomes de usuário, caminhos nem a transcrição da depuração de permissões na resposta.
4. **Validar (O1/O2/O4):** inspecione os modos finais, confirme que os três textos de entrada não mudaram, revise a resposta completa em comparação com o conteúdo permitido e execute uma verificação de marcador conhecido, interpretando corretamente a contagem e o status. Explique por que renomear um campo ou restringir o modo de um relatório que divulga informações não tornaria o conteúdo proposto apropriado para envio.
5. **Limpar (O5):** após a avaliação, remova somente os artefatos do desafio e conclua a limpeza do laboratório pai. Não é necessário compartilhar nem enviar nada de fato.

**Entregas:** os três textos de entrada inalterados e uma resposta, as observações finais de modo e suas justificativas, um registro antes/tentativa/depois da leitura, a decisão de divulgação, o resultado da verificação de marcador e a revisão completa do conteúdo, e a limpeza verificada. As evidências permanecem locais. Os cinco requisitos devem ser aprovados; uma leitura funcionando não compensa uma divulgação indevida, acesso excessivo, uma tentativa de imposição não verificada nem uma limpeza ausente.

**Dicas opcionais:** distinga o que o nome de um arquivo sugere do que o conteúdo dele contém. Classifique os campos antes de redigir uma resposta. Acesso de leitura e permissão para compartilhar são decisões diferentes. Mantenha um breve registro privado de qual observação sustenta cada afirmação.

Continue com as [perguntas](#perguntas) e os [critérios de conclusão](#critérios-de-conclusão) antes de remover os artefatos.

### Limpeza do desafio

Na raiz verificada do laboratório, inspecione `./challenge/private` e `./challenge/reports`. Remova individualmente, com `rm -i`, os quatro arquivos finais: `./challenge/reports/response.txt`, `./challenge/private/diagnostic-draft.txt`, `./challenge/private/request.txt` e `./challenge/private/service.conf`. Inspecione e remova quaisquer anotações extras do laboratório pelos nomes explícitos. Em uma tentativa incompleta, remova somente os arquivos que realmente existem.

Use `rmdir` nos diretórios agora vazios `./challenge/reports` e `./challenge/private` e depois em `./challenge`. Inspecione qualquer recusa em vez de escalar privilégios ou usar remoção recursiva. Volte à [limpeza do laboratório pai](#limpeza-após-a-avaliação). Revise a decisão de divulgação e a preservação das entradas antes de excluir essas evidências.

## Avaliação de conhecimentos

### Perguntas

Responda antes de abrir as [orientações de resposta](#orientações-de-resposta). Explique mecanismos e ações seguras, não apenas nomes de comandos.

1. **Q1 — O1:** Explique as três letras de permissão para arquivos e para diretórios. Por que um diretório pode permitir o acesso a um item filho conhecido sem permitir a listagem dos nomes? Um arquivo somente para leitura necessariamente resiste à exclusão?
2. **Q2 — O1/O2:** Por que a configuração termina em `400`, seus diretórios de trabalho em `700` e o relatório em `600`? O que haveria de errado em “tornar tudo executável e legível por todos”?
3. **Q3 — O2:** O que `umask 077` faz com novos arquivos de texto comuns e com diretórios? Por que defini-lo novamente deixou inalterada a configuração existente em `400`?
4. **Q4 — O3:** Uma leitura é bem-sucedida com o modo básico `000`. O que foi realmente verificado, o que continua não verificado e qual é a próxima ação segura? Um erro de arquivo inexistente provaria uma negação de acesso?
5. **Q5 — O1/O3:** Por que o proprietário normalmente consegue restaurar a permissão de leitura de um arquivo ilegível sem `sudo`? Por que remover a busca do diretório pai complicaria essa recuperação?
6. **Q6 — O4:** O rascunho de diagnóstico não tem um campo `api_token`. É apropriado anexá-lo? Explique o conteúdo permitido e o que uma contagem zero de linhas correspondentes pode e não pode provar.
7. **Q7 — O4/O5:** Uma credencial real já foi divulgada. Alterar o modo do arquivo, renomeá-lo ou excluir o relatório local a revogaria? Como isso difere do reparo deste exercício sintético?
8. **Q8 — O5:** A limpeza chega ao diretório pai, mas `rmdir` falha. O que deve permanecer aberto, o que você deve inspecionar e quando a limpeza pode ser relatada como bem-sucedida?

### Orientações de resposta

- **Q1:** Leitura/escrita em um arquivo dizem respeito ao conteúdo, e execução diz respeito a rodar um programa. Em um diretório, leitura diz respeito aos nomes, escrita à alteração de entradas e busca à travessia/consulta. Listar e acessar por um nome conhecido são coisas diferentes; o item filho ainda tem seus próprios controles. A remoção depende do diretório pai e de regras adicionais, não apenas da permissão de escrita no arquivo.
- **Q2:** A configuração preparada precisa ser lida, os diretórios precisam de inspeção, travessia e gerenciamento de entradas, e o relatório é editável. Outras identidades não têm nenhum papel. Acesso amplo concede capacidades desnecessárias; dados de configuração não precisam do bit de execução. Essas políticas servem a este cenário e não são um modelo completo de acesso de produção.
- **Q3:** A máscara filtra os bits solicitados na criação, resultando normalmente em `600` e `700` aqui. Ela não modifica retroativamente a configuração existente nem concede bits ausentes de um modo solicitado. Inspecione em vez de inferir os resultados.
- **Q4:** A inspeção estabelece o modo básico configurado; a leitura estabelece o sucesso para aquele processo. A negação esperada continua não verificada. Restaure o modo pretendido, registre a limitação e busque um ambiente adequado, sem escalar privilégios. Um erro de caminho deve ser diagnosticado separadamente. Nenhuma leitura final bem-sucedida pode provar retroativamente uma tentativa negada.
- **Q5:** A propriedade normalmente permite alterar o modo independentemente do bit de leitura do arquivo, enquanto a resolução do caminho ainda precisa da busca no diretório. Mantenha os diretórios acessíveis e restaure somente o bit pretendido do arquivo. Uma propriedade ou política de acesso inesperada é uma condição de parada, não uma permissão para alterar objetos não relacionados.
- **Q6:** Rejeite o anexo: o campo `context` contém o mesmo token sintético, e a observação interna é desnecessária. Redija apenas o nome do serviço, o resultado honesto da leitura e a declaração de omissão. Interprete o status da busca, além da contagem, e depois inspecione todos os campos. Uma busca literal detecta apenas o seu padrão conhecido.
- **Q7:** Alterações locais não revogam uma credencial real nem recuperam cópias. Siga o processo de incidentes do responsável e o procedimento de revogação/substituição. Aqui, remover e recriar pode corrigir o relatório falso, mas a explicação deve reconhecer esse limite; nenhuma operação com credencial real ocorre.
- **Q8:** Mantenha o shell aberto. Confirme o local e o caminho do laboratório registrado, inspecione as entradas restantes e remova somente os artefatos identificados. Tente novamente a partir da raiz verificada do laboratório. Relate sucesso somente depois da remoção bem-sucedida do diretório vazio e da verificação de ausência; não afirme que houve apagamento seguro.

Um raciocínio equivalente e correto é aceitável. Refaça as [perguntas](#perguntas) cuja explicação estiver faltando e depois revise os critérios abaixo.

## Critérios de conclusão

A conclusão é **autoavaliada**, ou uma outra pessoa pode revisar as mesmas evidências. Não é uma certificação, uma auditoria de segurança nem uma competência profissional verificada de forma independente. A revisão das fontes e o simples seguimento de uma receita de comandos não estabelecem a conclusão.

| Objetivo | Prática | Avaliação | Evidência necessária | Critério de aprovação |
| --- | --- | --- | --- | --- |
| O1 | Passos guiados 1–2 | Itens 1/4 do desafio; Q1/Q2/Q5 | Observações de identidade e propriedade, modos decodificados, explicação dos seis significados de permissão para arquivos/diretórios | O proprietário e o grupo são identificados; o conteúdo de arquivos, os nomes de diretórios, a travessia e a exclusão são distinguidos corretamente |
| O2 | Passos guiados 2–3 | Itens 1/4 do desafio; Q2/Q3 | Modos inicial e final, modo existente inalterado após aplicar a máscara novamente, justificativa de permissões específica da tarefa | Diretórios em `700`, configurações em `400`, relatórios e requisição/rascunho do desafio em `600`; nenhum bit básico de grupo/outros nem bits de execução não pretendidos; a diferença entre criação e reparo é explicada |
| O3 | Passo guiado 4 e orientação de recuperação | Item 2 do desafio; Q4/Q5 | Linha de base bem-sucedida no mesmo arquivo, falha configurada, leitura negada real com diagnóstico/status e restauração mínima seguida de uma leitura bem-sucedida | As tentativas guiada e do desafio demonstram uma negação de acesso atribuível à falha pretendida; os modos restaurados e as leituras são aprovados; a inspeção da configuração não substitui a imposição |
| O4 | Passo guiado 5 | Itens 3/4 do desafio; Q6/Q7 | Relatório/resposta mínimos, motivo para rejeitar o rascunho e a proposta de acesso amplo, revisão completa do conteúdo, contagem/status do marcador, textos de entrada do desafio preservados | Aparecem apenas fatos autorizados; tokens sintéticos e detalhes internos/pessoais estão ausentes; a contagem `0` com status `1` sustenta a verificação do marcador conhecido; os limites e a resposta à exposição são explicados |
| O5 | Limpeza guiada e do desafio | Revisão da limpeza; Q7/Q8 | Escopo de exclusão inspecionado, remoção dos artefatos nomeados, remoção do diretório vazio e observação final de ausência | Apenas artefatos do laboratório são removidos; o laboratório registrado não existe mais; nenhuma limpeza forçada ou recursiva e nenhuma afirmação falsa de apagamento ou revogação |

**Aprovação:** todas as linhas e todas as respostas da avaliação atendem aos seus critérios. Segurança e limpeza são obrigatórias; nenhuma pontuação compensa a falta delas. **Ainda não aprovado:** qualquer linha sem evidência, relatório que divulga informações proibidas, entradas alteradas sem intenção ou uma operação que afeta arquivos não relacionados.

**Tentativa limitada pelo ambiente:** se a negação esperada não ocorrer, marque a imposição do O3 como **não verificada**, mantenha a observação real e restaure/limpe com segurança. Uma explicação correta rende evidência conceitual, mas não dispensa o requisito prático. Repita o exercício afetado, com orientação, em um ambiente adequado de usuário comum antes de afirmar a conclusão. Não altere a política do sistema nem invente um resultado aprovado.

Revise O1–O4 enquanto os artefatos existem, faça a [limpeza do desafio](#limpeza-do-desafio) e a [limpeza do laboratório pai](#limpeza-após-a-avaliação) e depois conclua o O5. Para remediação, use o [procedimento de retomada](#retomar-uma-sessão-interrompida) para um estado conhecido, ou uma limpeza inspecionada seguida de uma nova tentativa. Relate separadamente a revisão da documentação, as verificações de sintaxe e a execução real.

## Próximos passos

Se o diagnóstico de caminhos ou a limpeza estiver incerto, revisite [Operações Seguras com Arquivos no Terminal](../../../modules/terminal-file-operations.md) (módulo em inglês). A [trilha de aprendizagem de Fundamentos](../../../learning-paths/foundations.md) (em inglês) mostra onde este módulo se encaixa entre os módulos atuais. Para melhorar este módulo, use o [guia de autoria do currículo](../../../curriculum-authoring-guide.md) (em inglês).

O [Gerenciamento de Mudanças Locais com Git](../../../modules/git-change-management.md) (módulo em inglês) está disponível, com a execução em laboratório pendente. Ele compartilha `terminal-file-operations` como pré-requisito obrigatório; este módulo não é uma dependência obrigatória adicional. O módulo de Git trata de staging e histórico, enquanto este módulo estabelece decisões sobre acesso local e divulgação. Identidades de serviço separadas, administração de ACLs, gerenciadores de segredos e tratamento real de incidentes exigem estudo adicional e estão fora deste exercício de Fundamentos.
