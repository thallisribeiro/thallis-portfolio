---
title: "As 6 brechas de segurança que um auditor encontrou no Eunoimóvel antes de qualquer cliente ver"
date: 2026-08-15
tema: Produto
summary: "Enquanto eu construía a Fatia 2 do Eunoimóvel, um agente auditor rodou atrás só de brecha de acesso — e achou 6 reais no mesmo dia."
---

Complemento de uma [entrada do diário](/blog/diario-6-no-mesmo-dia-comecei-a-reconstruir-uma-imobiliaria-inteira/): no mesmo dia em que o Eunoimóvel foi ao ar pela primeira vez, também rodei um agente com uma única função — desconfiar do controle de acesso que eu tinha acabado de construir.

## O que ele achou

Antes mesmo da auditoria formal, duas brechas já tinham aparecido na primeira fatia: o upload de mídia estava aceitando escrita anônima (qualquer um, sem login, conseguia subir arquivo), e o processo de auto-cadastro tinha um caminho onde o usuário conseguia escalar o próprio nível de permissão sozinho, sem ninguém aprovar.

Corrigidas essas duas, segui construindo a Fatia 2 (controle de acesso pra Leads e para o escopo real de uma imobiliária). Rodei o agente auditor de novo, dedicado só a achar brecha de acesso — não código bonito, não performance, só "onde alguém consegue ver ou fazer o que não devia". Ele voltou com **6 brechas reais**, todas corrigidas ainda no mesmo dia. Uma delas, separada: apagar um registro que ainda era referenciado por outro lugar do sistema quebrava a integridade dos dados — não é bem uma falha de acesso, mas o mesmo tipo de "descobri rodando, não pensando antes".

## Por que um agente separado, e não eu mesmo revisando

Eu tinha acabado de escrever aquele código. Minha atenção estava em fazer funcionar, não em desconfiar dele. Um agente cuja única tarefa é auditoria de acesso não carrega esse viés — ele não sabe (nem precisa saber) a intenção por trás do código, só se o resultado permite algo que não deveria permitir.

Esse padrão — construir com um agente, auditar com outro que nunca viu a intenção original — virou prática permanente depois desse dia. Nenhum controle de acesso novo vai pro ar sem passar por alguém (ou algo) cujo trabalho é só tentar quebrar.
