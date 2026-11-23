# Comece aqui

> **Rascunho de tradução, pendente de revisão humana.** Este texto foi preparado como versão em português do Brasil de [Start Here](start-here.md) e ainda não foi revisado nem aprovado. Se houver diferença, vale a versão em inglês, que é a oficial.

Boas-vindas. Este guia ajuda você a dar os primeiros passos no DevOps Engineer Roadmap. Ele pressupõe que você já usa bem um computador, mas não que já tenha usado um terminal. A leitura leva poucos minutos, e depois você vai direto para a primeira atividade.

English: [Start Here](start-here.md).

## O que você vai fazer primeiro

Você começa por um módulo, [Operações Seguras com Arquivos no Terminal](locales/pt-BR/modules/terminal-file-operations.md). Nele, você usa um terminal para criar uma pequena pasta de prática, copiar e organizar alguns arquivos fictícios, lidar com um erro proposital e, no fim, limpar tudo. Nada do que você faz ali mexe nos seus arquivos reais.

## Por que as habilidades de terminal importam

A maioria dos servidores, das ferramentas de automação e dos serviços de nuvem é controlada por comandos digitados, e não por cliques. O terminal é rápido e preciso e, justamente por fazer exatamente o que você digita, exige cuidado. O primeiro módulo ensina um hábito que você vai usar sempre: **saiba onde você está, preveja o que o comando vai fazer, execute-o e confira o resultado.**

## O que você precisa

- Um computador com Linux ou macOS. Os laboratórios foram testados somente em Linux; o macOS ainda não foi validado. Windows não é abordado.
- Uma conta de usuário comum. Você não precisa de acesso de administrador e não deve usá-lo nestes exercícios.
- Uma pasta pessoal em que você possa gravar, como a sua pasta pessoal (home).
- Nenhuma conta de nuvem, nenhum software pago e nenhuma senha ou chave real. Todos os dados dos exercícios são fictícios.
- Paciência, como em qualquer habilidade nova. O tempo necessário varia de pessoa para pessoa, então siga no seu ritmo.

O módulo de Git também exige que o Git já esteja instalado. Você não precisa dele nos dois primeiros módulos.

## Abra um terminal

**macOS:** pressione Command + Espaço para abrir o Spotlight, digite `Terminal` e pressione Return. Você também pode abrir o Finder, depois Aplicativos, depois Utilitários e, por fim, Terminal.

**Linux:** os detalhes dependem da sua distribuição. Procure um aplicativo chamado "Terminal" (ou "Console") no menu de aplicativos, ou tente o atalho Ctrl + Alt + T, que funciona em muitos ambientes de desktop.

Abre-se uma janela com uma linha de texto à sua espera. Essa linha é o **prompt**.

## Como é um prompt

O prompt indica que o shell está pronto para receber um comando. Ele varia de computador para computador, mas muitas vezes termina em `$` ou `%`. Esta é **apenas uma ilustração, não um passo de laboratório**, e os nomes são inventados:

```text
learner@laptop:~$ pwd
/home/learner
```

Na ilustração, `learner@laptop:~$` é o prompt. Você digitaria somente `pwd` e pressionaria Enter. A linha seguinte, `/home/learner`, é a **saída**: a resposta do computador.

## Comandos, prompt e saída

- **Não digite o símbolo do prompt.** Quando este curso mostra um comando, ele omite o `$`. Digite ou cole apenas o comando.
- **Os comandos aparecem em blocos de código.** A saída, quando aparece, costuma ser descrita no texto ou em um "Ponto de verificação" abaixo do bloco. A sua saída pode diferir em detalhes, como os nomes das suas pastas.
- **Execute um comando por vez**, a menos que o módulo diga outra coisa. Não cole uma lição inteira de uma vez: alguns comandos falham de propósito e alguns fazem uma pergunta que você precisa responder.
- **Digite exatamente o que vê.** Espaços, aspas e letras maiúsculas importam.

## Pontos de verificação

Depois da maioria dos passos, o módulo traz um **Ponto de verificação**: uma descrição curta do que você deve ver. Compare com o que aconteceu. Se for igual, continue. Se não for, não siga adiante torcendo para dar certo: pare e descubra primeiro o motivo.

## O que significa STOP

Alguns comandos dos laboratórios imprimem uma linha que começa com `STOP`. É uma mensagem de segurança do próprio laboratório: algo não está como o esperado e o próximo passo poderia causar dano. Quando você a vir:

1. Não continue e não tente forçar o comando a funcionar.
2. Leia a mensagem e o ponto de verificação anterior.
3. Procure no módulo as instruções de recuperação correspondentes (veja a próxima seção).
4. Se ainda não conseguir entender o problema, interrompa o exercício. Parar é um resultado correto, não uma falha.

## Instruções de recuperação

Cada módulo explica o que fazer se você for interrompido, fechar o terminal ou cometer um erro. Procure a seção sobre retomar uma sessão interrompida e as orientações de recuperação junto ao passo em que algo deu errado. Use-as em vez de recomeçar às cegas, e nunca apague coisas "para ver se resolve". A limpeza remove apenas o que o laboratório criou.

## Onde guardar suas anotações

O módulo pede que você registre algumas informações, como o caminho da sua pasta de prática. Guarde as anotações em um lugar comum **fora da pasta de prática**, porque a limpeza apaga essa pasta. Um arquivo de texto simples na sua pasta de documentos funciona bem. Não escreva nele senhas, chaves ou informações pessoais reais.

## Como saber que você terminou

Cada módulo termina com os **Critérios de conclusão**, uma lista de evidências que você deve conseguir apresentar. Percorra a lista linha por linha. Se faltar a evidência de um item obrigatório, você ainda não passou nesse item e deve repetir essa parte. Isto é **autoavaliação**, não uma certificação, e o projeto não verifica os seus resultados.

## Seu caminho

1. **Comece agora:** [Encontre um diretório inicial](locales/pt-BR/modules/terminal-file-operations.md#encontre-um-diretório-inicial), no primeiro módulo, [Operações Seguras com Arquivos no Terminal](locales/pt-BR/modules/terminal-file-operations.md). Leia antes a Visão geral e os Pré-requisitos, se ainda não leu.
2. **Em seguida:** [Acesso Local e Segredos de Teste](locales/pt-BR/modules/local-access-and-secrets.md) (quem pode ler ou alterar um arquivo e o que compartilhar).
3. **Depois:** [Gerenciamento de Mudanças Locais com Git](locales/pt-BR/modules/git-change-management.md) (registrar e desfazer mudanças). Os módulos 2 e 3 exigem o módulo 1, mas não um ao outro, então você pode fazer o de Git antes do de acesso, se preferir.

A [trilha de aprendizagem de Foundations](learning-paths/foundations.md) (em inglês) mostra o quadro completo.

Antes de confiar nas saídas esperadas de um módulo, leia a **Situação da verificação** no início dele. Ela diz o que foi e o que não foi testado, e em quais sistemas. As versões em português dos módulos são rascunhos que aguardam revisão humana.

## Glossário

| Termo | Significado |
| --- | --- |
| Terminal | A janela em que você digita comandos e lê as respostas. |
| Shell | O programa dentro do terminal que lê os seus comandos e os executa. |
| Prompt | O texto que o shell mostra quando está pronto para um comando, muitas vezes terminando em `$` ou `%`. |
| Comando | Uma instrução que você digita, como `pwd`. |
| Argumento | Informação extra passada a um comando, como o nome de um arquivo. |
| Saída | O que um comando imprime de volta. |
| Diretório | Uma pasta. |
| Caminho (path) | O endereço de um arquivo ou diretório, como `/home/learner`. |
| Diretório pessoal (home) | A sua pasta pessoal no computador. |
| Permissão | Uma regra sobre quem pode ler, alterar ou executar um arquivo. |
| Segredo | Informação que deve permanecer privada, como uma senha ou chave. Os exercícios usam segredos falsos. |
| Git | Uma ferramenta que registra o histórico de mudanças em arquivos. |
| Repositório | Uma pasta cujas mudanças o Git registra. |
| Ponto de verificação | A descrição do que você deve ver antes de seguir adiante. |
| Descartável | Que pode ser apagado com segurança. As pastas de prática são descartáveis. |
