# Rascunho de aviso de privacidade — Mercado do Pátio

> **RASCUNHO PARA DISCUSSÃO E REVISÃO. NÃO PUBLICAR COMO DOCUMENTO FINAL.**
>
> Este texto foi preparado a partir do comportamento atualmente identificado no
> código. Ele não constitui parecer jurídico nem garante conformidade com a
> LGPD. Antes de publicar, o condomínio/controlador deve confirmar os fatos,
> definir as decisões pendentes e obter revisão do responsável jurídico ou de
> privacidade.

## Identificação do controlador

- **Controlador:** [informar razão social/nome do condomínio ou responsável]
- **CNPJ, se aplicável:** [informar]
- **Endereço:** [informar]
- **Canal de privacidade e solicitações dos titulares:** [informar e-mail ou
  formulário]
- **Encarregado pelo tratamento, se aplicável:** [informar canal de contato]

## A quem e a que serviço este aviso se aplica

Este aviso descreve o tratamento de dados pessoais no sistema Mercado do Pátio,
usado para administrar o minimercado do condomínio, seus usuários, produtos,
compras, unidades e registros de auditoria.

## Dados tratados e finalidades

Conforme as funcionalidades atualmente implementadas, o sistema pode tratar:

| Dados | Finalidades identificadas no sistema |
| --- | --- |
| Nome, e-mail, telefone, número de usuário, perfil e unidade vinculada | Criar e administrar contas, autenticar usuários e aplicar permissões |
| Identificador Google e dados básicos de perfil recebidos no login Google, quando esse meio é usado | Associar a conta Google a uma conta cadastrada e autenticar o usuário |
| Senha armazenada como hash, tokens de redefinição e respectivos prazos | Autenticação local e recuperação de acesso; a senha em texto não deve ser armazenada |
| Produtos, quantidade, valor, data, comprador e unidade associada a uma compra | Registrar compras, atualizar estoque, consultar histórico e gerar relatórios |
| Ação, detalhes do evento, identificação/nome do usuário, data e hora | Manter registros de auditoria e apoiar a segurança e a rastreabilidade |
| Endereço IP | Complementar determinados eventos de auditoria de segurança e operação |
| Cookie de sessão | Manter a sessão autenticada enquanto o usuário utiliza o sistema |

O código registra o endereço IP (`req.ip`) em eventos de registro de compra,
cadastro, exclusão lógica e restauração de usuários, alteração de senha e
solicitações/redefinições de senha. A tela de Auditoria apresenta o IP e os
demais detalhes a administradores autorizados. O IP não é adicionado por essa
rotina a todos os eventos do sistema.

**Finalidades e bases legais:** o controlador deve revisar e determinar a base
legal adequada para cada finalidade, considerando a operação real do condomínio.
Este rascunho não presume consentimento nem escolhe uma base legal.

## Compartilhamento e operadores

O acesso interno deve ser limitado a pessoas autorizadas conforme seus perfis.
O código restringe a consulta da Auditoria ao perfil de administrador.

O sistema integra ou pode integrar os seguintes serviços:

- **Google:** autenticação OAuth, quando habilitada.
- **Resend:** envio de credenciais temporárias e mensagens de recuperação de
  senha.
- **Render:** hospedagem da aplicação e do banco, conforme a implantação
  descrita no projeto.

Antes de publicar este aviso, o controlador deve confirmar quais serviços estão
ativos no ambiente utilizado, quais dados recebem, os termos e contratos
aplicáveis, a localização/processamento dos dados e eventuais transferências
internacionais.

## Retenção e descarte

O código não define um prazo geral de retenção para os registros de auditoria,
endereços IP, compras ou contas excluídas logicamente. Contas excluídas são
preservadas e não podem iniciar sessão; o histórico permanece no banco.

**Decisão obrigatória antes da publicação:** definir e documentar prazos de
retenção por categoria, critérios de descarte ou anonimização, procedimento de
atendimento a pedidos de titulares e eventuais obrigações de conservação.

## Segurança e acesso

O sistema usa sessões com cookie `HttpOnly`; em produção, o cookie é configurado
com `Secure` e `SameSite=None`. A API aplica autenticação e autorização por
perfil em suas rotas. Essas medidas não eliminam todos os riscos; o controlador
deve também avaliar controles operacionais, acesso ao banco, cópias de
segurança, logs da hospedagem, resposta a incidentes e gestão de credenciais.

## Direitos e solicitações

O titular pode encaminhar solicitações relacionadas aos seus dados pelo canal
de privacidade informado pelo controlador, que deverá avaliar e responder nos
termos da legislação aplicável. O canal, o processo de verificação de identidade
e os prazos operacionais precisam ser definidos antes da publicação.

## Atualizações

**Versão:** rascunho  
**Data de preparação:** 2 de novembro de 2026  
**Última revisão pelo controlador:** [preencher após revisão]

O controlador deve indicar como os usuários serão informados sobre mudanças
materiais neste aviso.

## Lista de revisão antes de publicar

- Confirmar a identidade do controlador, canal de contato e responsável por
  privacidade.
- Validar finalidades e bases legais com assessoria adequada.
- Definir prazos de retenção para IPs, auditoria, sessões, tokens, compras e
  contas excluídas.
- Confirmar provedores, contratos, subprocessadores, localizações e
  transferências internacionais.
- Confirmar se logs da API, hospedagem, proxy e banco também registram IPs.
- Definir o fluxo para solicitações de titulares e incidentes de segurança.
- Revisar se a coluna de IP na Auditoria é necessária para cada perfil e se o
  acesso administrativo é apropriado.
- Revisar e aprovar o texto final antes de disponibilizá-lo aos usuários.
