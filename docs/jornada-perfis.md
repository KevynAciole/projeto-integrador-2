# Jornada dos perfis no sistema

Este documento descreve o que cada perfil pode fazer no Mercado do Pátio, desde a entrada no sistema até as tarefas mais comuns. As permissões são aplicadas tanto na interface quanto na API.

## Acesso comum

1. Entre com **Continuar com Google** ou com o número de usuário/telefone e a senha.
2. No primeiro acesso com uma senha temporária, crie uma senha pessoal antes de continuar.
3. Use o menu lateral para abrir as áreas disponíveis para seu perfil.
4. Para sair, use o ícone de saída junto ao nome do usuário.

O endereço de e-mail cadastrado é único: serve para receber credenciais e também para identificar a conta Google. O login local continua disponível por número de usuário ou telefone.

## Administrador

O administrador tem acesso às funções de gestão do condomínio e do minimercado.

**Jornada típica**

1. Abra **Visão geral** para acompanhar os indicadores apresentados.
2. Em **Estoque**, consulte produtos e cadastre, edite ou desative itens.
3. Em **Comprar produtos**, registre uma retirada como compra do próprio administrador.
4. Em **Compras**, consulte o histórico geral de compras.
5. Em **Relatórios**, acompanhe totais mensais e valores por unidade.
6. Em **Unidades**, cadastre e atualize blocos e apartamentos.
7. Em **Usuários**, cadastre, edite, exclua logicamente e restaure contas. Os dados e o histórico dos usuários excluídos são preservados.
8. Em **Auditoria**, consulte os registros de atividade do sistema.

**Permissões principais:** pode gerenciar todos os perfis, inclusive outros administradores; gerencia produtos, unidades e usuários. Pode entrar por login local e, quando vinculado, por Google.

## Síndico

O síndico acompanha a operação do condomínio, compras e moradores.

**Jornada típica**

1. Abra **Visão geral** para consultar o resumo disponível.
2. Em **Compras**, veja o histórico geral.
3. Em **Relatórios**, confira totais por mês e unidade.
4. Em **Unidades**, consulte, cadastre e atualize apartamentos.
5. Em **Usuários**, cadastre, edite, exclua logicamente e restaure usuários não administradores.
6. Em **Comprar produtos**, registre uma compra.

**Limites:** não pode cadastrar, editar, excluir ou restaurar administradores. Não tem acesso à auditoria nem ao gerenciamento do estoque. Pode entrar por login local e, quando vinculado, por Google.

## Gestor de Estoque

O gestor de estoque mantém o catálogo atualizado e pode registrar compras próprias.

**Jornada típica**

1. Acesse **Estoque** para consultar os produtos e suas quantidades.
2. Cadastre novos itens, ajuste nome, categoria, quantidade ou preço, ou desative produtos que não devem mais aparecer.
3. Em **Registrar compra**, selecione um produto, informe a quantidade e confirme a retirada.
4. Em **Minhas compras**, consulte as compras registradas em seu próprio nome.

**Limites:** não acessa usuários, unidades, relatórios nem o histórico geral de compras. Unidade e login Google são opcionais; o acesso local usa número de usuário ou telefone e senha.

## Condômino

O condômino consulta a unidade vinculada e pode comprar produtos do minimercado.

**Jornada típica**

1. Entre com Google usando o e-mail associado ao cadastro ou use seu número de usuário/telefone e senha.
2. Em **Comprar produtos**, escolha os itens, ajuste quantidades e confirme a retirada. A compra é vinculada à unidade cadastrada.
3. Em **Minhas compras**, acompanhe seu histórico e os totais do mês.
4. Em **Minha unidade**, confira o apartamento e os moradores vinculados.

**Cadastro:** pode solicitar autoinscrição pela opção de cadastro na tela de login, informando nome, e-mail, telefone e unidade. A solicitação gera um número de usuário e uma senha temporária; no primeiro acesso, a senha deve ser alterada. O cadastro também pode ser criado pela administração.

**Requisitos:** o cadastro precisa de e-mail, telefone válido e unidade. O condômino não gerencia usuários, unidades, produtos ou relatórios.

## Visitante

O visitante pode consultar o catálogo e os preços sem realizar compras.

**Jornada típica**

1. Entre com as credenciais fornecidas para a conta.
2. Acesse **Produtos e preços** para consultar os itens disponíveis e as quantidades.

**Limites:** o estoque aparece em modo somente leitura; não pode registrar compras nem acessar histórico, usuários, unidades ou relatórios.

## Acessibilidade e demonstração

- No menu lateral, qualquer perfil autenticado pode ativar **Alto contraste** ou **Aumentar fonte**.
- A opção **Conheça o sistema**, na tela de login, abre a demonstração interativa. Ela usa dados fictícios e não grava alterações no banco de dados; não é um perfil operacional.
